/**
 * @file: excel-import-with-duplicates.service.ts
 * @description: Улучшенный сервис для импорта заказов из Excel с проверкой дубликатов
 * @dependencies: exceljs, orders.service
 * @created: 2025-07-08
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Order, Priority } from '../../database/entities/order.entity';
import { Operation, OperationType } from '../../database/entities/operation.entity';
import { OrdersService } from './orders.service';
import type { Express } from 'express';

export interface DuplicateInfo {
  orderData: ParsedOrder;
  existingOrder: Order;
  differences: string[];
}

export interface ImportResultWithDuplicates {
  created: number;
  updated: number;
  duplicatesFound: DuplicateInfo[];
  errors: Array<{ order: string; error: string }>;
  needsUserDecision: boolean;
}

export interface DuplicateResolution {
  action: 'replace' | 'skip' | 'merge' | 'replace_completely' | 'restore';
  orderDrawingNumber: string;
}

export interface BatchDuplicateResolution {
  resolutions: DuplicateResolution[];
  defaultAction?: 'replace' | 'skip';
}

interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: Priority;
  workType?: string;
  operations: Array<{
    operationNumber: number;
    operationType: OperationType;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

@Injectable()
export class ExcelImportWithDuplicatesService {
  private readonly logger = new Logger(ExcelImportWithDuplicatesService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Первый этап импорта: анализ файла и поиск дубликатов
   */
  async analyzeExcelForDuplicates(
    file: Express.Multer.File,
    colorFilters: string[] = [],
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log('🔍 Анализ Excel файла на дубликаты:', {
      originalname: file.originalname,
      size: file.size,
      colorFiltersCount: colorFilters.length
    });
    
    if (!file?.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    const orders = await this.parseExcelFile(file, colorFilters);
    return await this.analyzeForDuplicates(orders);
  }

  /**
   * Второй этап импорта: применение решений пользователя
   */
  async processDuplicateResolutions(
    file: Express.Multer.File,
    resolutions: BatchDuplicateResolution,
    colorFilters: string[] = [],
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log('⚙️ Применение решений по дубликатам');
    
    const orders = await this.parseExcelFile(file, colorFilters);
    return await this.processOrdersWithResolutions(orders, resolutions);
  }

  /**
   * Простой импорт с автоматической обработкой дубликатов
   */
  async importOrdersWithAutoResolve(
    file: Express.Multer.File,
    autoAction: 'replace' | 'skip' = 'skip',
    colorFilters: string[] = [],
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log(`🚀 Автоматический импорт с действием для дубликатов: ${autoAction}`);
    
    const orders = await this.parseExcelFile(file, colorFilters);
    const resolutions: BatchDuplicateResolution = {
      resolutions: [],
      defaultAction: autoAction
    };
    
    return await this.processOrdersWithResolutions(orders, resolutions);
  }

  /**
   * Парсинг Excel файла
   */
  private async parseExcelFile(
    file: Express.Multer.File,
    colorFilters: string[] = [],
  ): Promise<ParsedOrder[]> {
    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.load(file.buffer);
    } catch (error) {
      throw new BadRequestException(`Ошибка чтения Excel файла: ${error.message}`);
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден');
    }

    this.logger.log('📄 Анализ рабочего листа:', {
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    });

    const orders: ParsedOrder[] = [];
    const errors: Array<{ order: string; error: string }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок

      try {
        if (this.shouldProcessRow(row, colorFilters)) {
          const order = this.parseRowToOrder(row);
          if (order) {
            orders.push(order);
          }
        }
      } catch (error) {
        this.logger.error(`Ошибка в строке ${rowNumber}:`, error.message);
        errors.push({
          order: `Строка ${rowNumber}`,
          error: error.message,
        });
      }
    });

    this.logger.log(`📊 Парсинг завершен: ${orders.length} заказов, ${errors.length} ошибок`);
    return orders;
  }

  /**
   * Анализ заказов на дубликаты
   */
  private async analyzeForDuplicates(orders: ParsedOrder[]): Promise<ImportResultWithDuplicates> {
    const duplicatesFound: DuplicateInfo[] = [];
    const newOrders: ParsedOrder[] = [];
    const errors: Array<{ order: string; error: string }> = [];

    for (const orderData of orders) {
      try {
        const existingOrder = await this.ordersService.findByDrawingNumberIncludingDeleted(
          orderData.drawingNumber,
        );

        if (existingOrder) {
          const differences = this.findDifferences(orderData, existingOrder);
          duplicatesFound.push({
            orderData,
            existingOrder,
            differences,
          });
        } else {
          newOrders.push(orderData);
        }
      } catch (error) {
        errors.push({
          order: orderData.drawingNumber,
          error: `Ошибка проверки дубликата: ${error.message}`,
        });
      }
    }

    return {
      created: newOrders.length,
      updated: 0,
      duplicatesFound,
      errors,
      needsUserDecision: duplicatesFound.length > 0,
    };
  }

  /**
   * Обработка заказов с учетом решений пользователя
   */
  private async processOrdersWithResolutions(
    orders: ParsedOrder[],
    resolutions: BatchDuplicateResolution,
  ): Promise<ImportResultWithDuplicates> {
    const result: ImportResultWithDuplicates = {
      created: 0,
      updated: 0,
      duplicatesFound: [],
      errors: [],
      needsUserDecision: false,
    };

    for (const orderData of orders) {
      try {
        const existingOrder = await this.ordersService.findByDrawingNumberIncludingDeleted(
          orderData.drawingNumber,
        );

        if (existingOrder) {
          // Находим решение для этого заказа
          const resolution = resolutions.resolutions.find(
            r => r.orderDrawingNumber === orderData.drawingNumber
          );
          
          const action = resolution?.action || resolutions.defaultAction || 'skip';

          switch (action) {
            case 'replace':
              await this.updateExistingOrder(existingOrder, orderData);
              result.updated++;
              this.logger.log(`✅ Умно обновлен заказ (с сохранением прогресса): ${orderData.drawingNumber}`);
              break;
            
            case 'replace_completely':
              await this.replaceExistingOrderCompletely(existingOrder, orderData);
              result.updated++;
              this.logger.log(`⚠️ Полностью заменен заказ (прогресс сброшен): ${orderData.drawingNumber}`);
              break;
            
            case 'merge':
              await this.mergeOrders(existingOrder, orderData);
              result.updated++;
              this.logger.log(`🔄 Объединен заказ: ${orderData.drawingNumber}`);
              break;
            
            case 'restore':
              if (existingOrder.isDeleted) {
                await this.ordersService.restore(existingOrder.id.toString());
                await this.updateExistingOrder(existingOrder, orderData);
                result.updated++;
                this.logger.log(`🔄 Восстановлен и обновлен заказ: ${orderData.drawingNumber}`);
              } else {
                await this.updateExistingOrder(existingOrder, orderData);
                result.updated++;
                this.logger.log(`✅ Обновлен заказ: ${orderData.drawingNumber}`);
              }
              break;
            
            case 'skip':
            default:
              this.logger.log(`⏭️ Пропущен дубликат: ${orderData.drawingNumber}`);
              break;
          }
        } else {
          await this.createNewOrder(orderData);
          result.created++;
          this.logger.log(`✨ Создан новый заказ: ${orderData.drawingNumber}`);
        }
      } catch (error) {
        result.errors.push({
          order: orderData.drawingNumber,
          error: error.message,
        });
        this.logger.error(`❌ Ошибка обработки заказа ${orderData.drawingNumber}:`, error.message);
      }
    }

    return result;
  }

  /**
   * Поиск различий между заказами с учетом статуса удаления
   */
  private findDifferences(newOrder: ParsedOrder, existingOrder: Order): string[] {
    const differences: string[] = [];

    // Проверяем если заказ удален
    if (existingOrder.isDeleted) {
      differences.push(`🗑️ Заказ помечен как удаленный (${existingOrder.deletedAt?.toLocaleDateString('ru-RU')})`);
    }

    if (newOrder.quantity !== existingOrder.quantity) {
      differences.push(`Количество: ${existingOrder.quantity} → ${newOrder.quantity}`);
    }

    if (newOrder.deadline.getTime() !== existingOrder.deadline.getTime()) {
      differences.push(`Дедлайн: ${existingOrder.deadline.toDateString()} → ${newOrder.deadline.toDateString()}`);
    }

    if (newOrder.priority !== existingOrder.priority) {
      differences.push(`Приоритет: ${existingOrder.priority} → ${newOrder.priority}`);
    }

    if (newOrder.workType !== existingOrder.workType) {
      differences.push(`Тип работы: ${existingOrder.workType || 'не указан'} → ${newOrder.workType || 'не указан'}`);
    }

    // Сравнение операций с учетом их статуса
    const existingOps = existingOrder.operations || [];
    const completedOps = existingOps.filter(op => op.status === 'COMPLETED').length;
    const inProgressOps = existingOps.filter(op => op.status === 'IN_PROGRESS').length;
    const pendingOps = existingOps.filter(op => op.status === 'PENDING').length;
    
    const newOpsCount = newOrder.operations.length;
    
    if (existingOps.length !== newOpsCount) {
      differences.push(`Количество операций: ${existingOps.length} → ${newOpsCount}`);
    }

    if (completedOps > 0) {
      differences.push(`⚠️ Выполнено операций: ${completedOps} (будут сохранены)`);
    }
    
    if (inProgressOps > 0) {
      differences.push(`🔄 В процессе операций: ${inProgressOps} (будут сохранены)`);
    }

    if (pendingOps > 0) {
      differences.push(`⏳ Ожидают операций: ${pendingOps} (будут обновлены)`);
    }

    return differences;
  }

  /**
   * Создание нового заказа
   */
  private async createNewOrder(orderData: ParsedOrder): Promise<void> {
    const order = this.orderRepository.create({
      drawingNumber: orderData.drawingNumber,
      quantity: orderData.quantity,
      remainingQuantity: orderData.quantity,
      deadline: orderData.deadline,
      priority: orderData.priority,
      workType: orderData.workType,
      status: 'planned',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Создаем операции
    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        operationNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        machineAxes: opData.machineAxes,
        status: 'PENDING',
        order: savedOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  /**
   * Обновление существующего заказа с сохранением прогресса (умное обновление)
   */
  private async updateExistingOrder(
    existingOrder: Order,
    orderData: ParsedOrder,
  ): Promise<void> {
    // Обновляем данные заказа
    existingOrder.quantity = orderData.quantity;
    existingOrder.deadline = orderData.deadline;
    existingOrder.priority = orderData.priority;
    existingOrder.workType = orderData.workType;

    await this.orderRepository.save(existingOrder);

    // КРИТИЧНО: НЕ удаляем выполненные операции!
    // Удаляем только невыполненные операции
    await this.operationRepository.delete({ 
      order: { id: existingOrder.id },
      status: 'PENDING'
    });

    // Добавляем новые операции только если их еще нет
    for (const opData of orderData.operations) {
      const existingOp = await this.operationRepository.findOne({
        where: {
          order: { id: existingOrder.id },
          operationNumber: opData.operationNumber
        }
      });

      if (!existingOp) {
        // Создаем новую операцию только если ее нет
        const operation = this.operationRepository.create({
          operationNumber: opData.operationNumber,
          operationType: opData.operationType,
          estimatedTime: opData.estimatedTime,
          machineAxes: opData.machineAxes,
          status: 'PENDING',
          order: existingOrder,
        });
        await this.operationRepository.save(operation);
      } else if (existingOp.status === 'PENDING') {
        // Обновляем только невыполненные операции
        existingOp.operationType = opData.operationType;
        existingOp.estimatedTime = opData.estimatedTime;
        existingOp.machineAxes = opData.machineAxes;
        await this.operationRepository.save(existingOp);
      }
      // Выполненные операции НЕ трогаем!
    }
  }

  /**
   * Полная замена существующего заказа (ОПАСНО: сбрасывает весь прогресс!)
   */
  private async replaceExistingOrderCompletely(
    existingOrder: Order,
    orderData: ParsedOrder,
  ): Promise<void> {
    this.logger.warn(`DANGEROUS: Completely replacing order ${existingOrder.drawingNumber} - all progress will be lost!`);
    
    // Обновляем данные заказа
    existingOrder.quantity = orderData.quantity;
    existingOrder.deadline = orderData.deadline;
    existingOrder.priority = orderData.priority;
    existingOrder.workType = orderData.workType;

    await this.orderRepository.save(existingOrder);

    // Полностью удаляем ВСЕ операции (ОПАСНО!)
    await this.operationRepository.delete({ order: { id: existingOrder.id } });

    // Создаем новые операции
    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        operationNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        machineAxes: opData.machineAxes,
        status: 'PENDING',
        order: existingOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  /**
   * Объединение заказов (умное слияние)
   */
  private async mergeOrders(
    existingOrder: Order,
    orderData: ParsedOrder,
  ): Promise<void> {
    // Обновляем только некоторые поля, сохраняя прогресс
    if (orderData.deadline > existingOrder.deadline) {
      existingOrder.deadline = orderData.deadline;
    }
    
    // Увеличиваем количество, если новое больше
    if (orderData.quantity > existingOrder.quantity) {
      const difference = orderData.quantity - existingOrder.quantity;
      existingOrder.quantity = orderData.quantity;
      existingOrder.remainingQuantity = existingOrder.remainingQuantity + difference;
    }

    // Обновляем приоритет, если новый выше
    const priorityOrder = {
      [Priority.LOW]: 1,
      [Priority.MEDIUM]: 2,
      [Priority.HIGH]: 3,
      [Priority.CRITICAL]: 4,
    };

    if (priorityOrder[orderData.priority] > priorityOrder[existingOrder.priority]) {
      existingOrder.priority = orderData.priority;
    }

    await this.orderRepository.save(existingOrder);

    // Добавляем новые операции, если их нет
    for (const opData of orderData.operations) {
      const existingOp = existingOrder.operations?.find(
        op => op.operationNumber === opData.operationNumber
      );

      if (!existingOp) {
        const operation = this.operationRepository.create({
          operationNumber: opData.operationNumber,
          operationType: opData.operationType,
          estimatedTime: opData.estimatedTime,
          machineAxes: opData.machineAxes,
          status: 'PENDING',
          order: existingOrder,
        });
        await this.operationRepository.save(operation);
      }
    }
  }

  // Вспомогательные методы из оригинального сервиса
  private shouldProcessRow(row: ExcelJS.Row, colorFilters: string[]): boolean {
    if (colorFilters.length === 0) return true;

    const cell = row.getCell(1);
    const fill = cell.style?.fill;
    if (!fill || fill.type !== 'pattern') return false;
    
    const cellColor = (fill as any).fgColor?.argb;
    return cellColor ? colorFilters.includes(cellColor) : false;
  }

  private parseRowToOrder(row: ExcelJS.Row): ParsedOrder | null {
    const drawingNumber = row.getCell(1).value?.toString();
    if (!drawingNumber) return null;

    const quantity = parseInt(row.getCell(2).value?.toString() || '0', 10);
    const deadlineValue = row.getCell(3).value;
    const deadline = this.parseDate(deadlineValue);
    const priority = this.parsePriority(row.getCell(4).value?.toString());
    const workType = row.getCell(5).value?.toString();

    const operations = this.parseOperations(row);

    return {
      drawingNumber,
      quantity,
      deadline,
      priority,
      workType,
      operations,
    };
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Неверный формат даты');
      }
      return date;
    }
    throw new Error('Дата не указана');
  }

  private parsePriority(value?: string): Priority {
    const priorityMap: Record<string, Priority> = {
      '1': Priority.CRITICAL,
      'критический': Priority.CRITICAL,
      '2': Priority.HIGH,
      'высокий': Priority.HIGH,
      '3': Priority.MEDIUM,
      'средний': Priority.MEDIUM,
      '4': Priority.LOW,
      'низкий': Priority.LOW,
    };

    const priority = priorityMap[value?.toLowerCase() || ''];
    return priority || Priority.MEDIUM;
  }

  private parseOperations(row: ExcelJS.Row): ParsedOrder['operations'] {
    const operations: ParsedOrder['operations'] = [];
    
    // Предполагаем, что операции начинаются с колонки F (6)
    // и каждая операция занимает 4 колонки
    for (let i = 6; i <= 30; i += 4) {
      const operationNumber = parseInt(row.getCell(i).value?.toString() || '0', 10);
      if (!operationNumber) break;

      const operationType = this.parseOperationType(row.getCell(i + 1).value?.toString());
      const machineAxes = parseInt(row.getCell(i + 2).value?.toString() || '3', 10);
      const estimatedTime = parseInt(row.getCell(i + 3).value?.toString() || '0', 10);

      operations.push({
        operationNumber,
        operationType,
        machineAxes,
        estimatedTime,
      });
    }

    return operations;
  }

  private parseOperationType(value?: string): OperationType {
    const typeMap: Record<string, OperationType> = {
      'фрезерная': OperationType.MILLING,
      'milling': OperationType.MILLING,
      'ф': OperationType.MILLING,
      'токарная': OperationType.TURNING,
      'turning': OperationType.TURNING,
      'т': OperationType.TURNING,
    };

    const type = typeMap[value?.toLowerCase() || ''];
    return type || OperationType.MILLING;
  }
}
