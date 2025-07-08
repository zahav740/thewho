/**
 * @file: excel-import.service.FIXED.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
 * @description: Сервис для импорта заказов из Excel с корректными фильтрами и проверкой дубликатов
 * @dependencies: exceljs, orders.service
 * @created: 2025-01-28
 * @updated: 2025-07-08 - ИСПРАВЛЕНЫ цветовые фильтры и добавлена проверка дубликатов
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Order, Priority } from '../../database/entities/order.entity';
import { Operation, OperationType } from '../../database/entities/operation.entity';
import { OrdersService } from './orders.service';
import type { Express } from 'express';

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  duplicates: Array<{ 
    drawingNumber: string; 
    action: 'update' | 'skip'; 
    existingOrder: Order 
  }>;
  errors: Array<{ order: string; error: string }>;
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

interface ImportOptions {
  colorFilters: string[];
  duplicateAction: 'update' | 'skip' | 'ask'; // 'ask' будет требовать интерактивного выбора
  autoConfirmDuplicates?: boolean;
}

@Injectable()
export class ExcelImportServiceFixed {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly ordersService: OrdersService,
  ) {}

  async importOrders(
    file: Express.Multer.File,
    options: ImportOptions = { colorFilters: [], duplicateAction: 'ask' },
  ): Promise<ImportResult> {
    console.log('🔍 ИСПРАВЛЕННЫЙ EXCEL IMPORT SERVICE: Начало импорта:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      hasBuffer: !!file.buffer,
      bufferSize: file.buffer?.length,
      colorFiltersCount: options.colorFilters.length,
      duplicateAction: options.duplicateAction
    });
    
    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.load(file.buffer);
      console.log('✅ Excel успешно загружен!');
    } catch (error) {
      console.error('❌ Ошибка загрузки Excel:', error);
      throw new BadRequestException(`Ошибка чтения Excel файла: ${error.message}`);
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден');
    }

    console.log('📄 Найден рабочий лист:', {
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    });

    // 🔍 Диагностика: показываем цветовую информацию
    this.analyzeWorksheetColors(worksheet);

    const orders: ParsedOrder[] = [];
    const errors: Array<{ order: string; error: string }> = [];

    let processedRows = 0;
    let filteredRows = 0;
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        console.log('🗺 Пропускаем заголовок в строке', rowNumber);
        return;
      }

      try {
        // ИСПРАВЛЕНО: Корректная проверка цветовых фильтров
        if (this.shouldProcessRowFixed(row, options.colorFilters)) {
          const order = this.parseRowToOrder(row);
          if (order) {
            orders.push(order);
            console.log(`✅ Обработана строка ${rowNumber}: ${order.drawingNumber}`);
          } else {
            console.log(`⚠️ Пустая строка ${rowNumber}`);
          }
        } else {
          console.log(`🎨 Пропускаем строку ${rowNumber} (не проходит цветовой фильтр)`);
          filteredRows++;
        }
        processedRows++;
      } catch (error) {
        console.error(`❌ Ошибка в строке ${rowNumber}:`, error.message);
        errors.push({
          order: `Строка ${rowNumber}`,
          error: error.message,
        });
      }
    });

    console.log('📊 Обработка завершена:', {
      totalRows: processedRows,
      filteredRows,
      parsedOrders: orders.length,
      errors: errors.length
    });

    // ИСПРАВЛЕНО: Обработка с проверкой дубликатов
    return this.processImportedOrdersWithDuplicateCheck(orders, errors, options);
  }

  // ИСПРАВЛЕНО: Корректная проверка цветовых фильтров
  private shouldProcessRowFixed(row: ExcelJS.Row, colorFilters: string[]): boolean {
    // Если фильтры не заданы, обрабатываем все строки
    if (!colorFilters || colorFilters.length === 0) {
      console.log(`⭐ Строка ${row.number}: обрабатываем (нет фильтров)`);
      return true;
    }

    // Проверяем цвет первой ячейки (можно изменить на любую нужную ячейку)
    const cell = row.getCell(1);
    const fill = cell.fill;
    
    console.log(`🎨 Строка ${row.number}: проверяем цвет ячейки A${row.number}`);
    
    if (!fill) {
      console.log(`   Цвет: отсутствует`);
      return false;
    }

    if (fill.type === 'pattern' && fill.pattern === 'solid') {
      const pattern = fill as ExcelJS.FillPattern;
      const bgColor = pattern.bgColor;
      const fgColor = pattern.fgColor;
      
      // Проверяем и background, и foreground цвета
      const cellColors = [
        bgColor?.argb,
        fgColor?.argb
      ].filter(Boolean);
      
      console.log(`   Найденные цвета:`, cellColors);
      console.log(`   Ищем цвета:`, colorFilters);
      
      // ИСПРАВЛЕНО: Правильное сравнение цветов
      for (const cellColor of cellColors) {
        if (cellColor && colorFilters.includes(cellColor)) {
          console.log(`   ✅ Цвет ${cellColor} найден в фильтрах!`);
          return true;
        }
      }
      
      console.log(`   ❌ Цвета не совпадают с фильтрами`);
      return false;
    }

    if (fill.type === 'gradient') {
      console.log(`   Градиентная заливка (пропускаем)`);
      return false;
    }

    console.log(`   Неизвестный тип заливки: ${fill.type}`);
    return false;
  }

  // НОВОЕ: Анализ цветов в таблице для диагностики
  private analyzeWorksheetColors(worksheet: ExcelJS.Worksheet): void {
    console.log('🎨 Анализ цветов в таблице:');
    const foundColors = new Set<string>();
    
    // Проверяем первые 10 строк
    for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const cell = row.getCell(1);
      const fill = cell.fill;
      
      if (fill && fill.type === 'pattern' && fill.pattern === 'solid') {
        const pattern = fill as ExcelJS.FillPattern;
        const colors = [
          pattern.bgColor?.argb,
          pattern.fgColor?.argb
        ].filter(Boolean);
        
        colors.forEach(color => foundColors.add(color as string));
        
        if (colors.length > 0) {
          console.log(`   Строка ${rowNum}: ${colors.join(', ')}`);
        }
      }
    }
    
    if (foundColors.size > 0) {
      console.log('🎨 Найденные цвета в файле:', Array.from(foundColors));
      console.log('💡 Используйте эти значения для фильтрации:');
      Array.from(foundColors).forEach(color => {
        console.log(`   "${color}"`);
      });
    } else {
      console.log('🎨 Цветных ячеек не найдено');
    }
  }

  private parseRowToOrder(row: ExcelJS.Row): ParsedOrder | null {
    const drawingNumber = row.getCell(1).value?.toString()?.trim();
    if (!drawingNumber) return null;

    const quantity = parseInt(row.getCell(2).value?.toString() || '0', 10);
    const deadlineValue = row.getCell(3).value;
    const deadline = this.parseDate(deadlineValue);
    const priority = this.parsePriority(row.getCell(4).value?.toString());
    const workType = row.getCell(5).value?.toString()?.trim();

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

  // НОВОЕ: Обработка с проверкой дубликатов
  private async processImportedOrdersWithDuplicateCheck(
    orders: ParsedOrder[],
    existingErrors: Array<{ order: string; error: string }>,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      duplicates: [],
      errors: existingErrors,
    };

    console.log(`🔍 Начинаем обработку ${orders.length} заказов с проверкой дубликатов...`);

    for (const orderData of orders) {
      try {
        // Проверяем существующий заказ
        const existingOrder = await this.ordersService.findByDrawingNumber(
          orderData.drawingNumber,
        );

        if (existingOrder) {
          console.log(`🔄 Найден дубликат: ${orderData.drawingNumber} (ID: ${existingOrder.id})`);
          
          // Добавляем в список дубликатов
          result.duplicates.push({
            drawingNumber: orderData.drawingNumber,
            action: options.duplicateAction === 'skip' ? 'skip' : 'update',
            existingOrder
          });

          // Выполняем действие в зависимости от настроек
          if (options.duplicateAction === 'update' || options.autoConfirmDuplicates) {
            console.log(`   ↻ Обновляем существующий заказ...`);
            await this.updateExistingOrderSafely(existingOrder, orderData);
            result.updated++;
          } else if (options.duplicateAction === 'skip') {
            console.log(`   ⏭ Пропускаем дубликат...`);
            result.skipped++;
          } else {
            // Для режима 'ask' пропускаем и добавляем в список для интерактивного выбора
            console.log(`   ❓ Требуется выбор пользователя...`);
            result.skipped++;
          }
        } else {
          console.log(`✨ Создаем новый заказ: ${orderData.drawingNumber}`);
          await this.createNewOrder(orderData);
          result.created++;
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки заказа ${orderData.drawingNumber}:`, error.message);
        result.errors.push({
          order: orderData.drawingNumber,
          error: error.message,
        });
      }
    }

    console.log('📊 Обработка дубликатов завершена:', {
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      duplicates: result.duplicates.length,
      errors: result.errors.length
    });

    return result;
  }

  private async createNewOrder(orderData: ParsedOrder): Promise<void> {
    const order = this.orderRepository.create({
      drawingNumber: orderData.drawingNumber,
      quantity: orderData.quantity,
      remainingQuantity: orderData.quantity,
      deadline: orderData.deadline,
      priority: orderData.priority,
      status: 'planned',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Создаем операции
    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        operationNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        order: savedOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  // НОВОЕ: Безопасное обновление с сохранением важных данных
  private async updateExistingOrderSafely(
    existingOrder: Order,
    orderData: ParsedOrder,
  ): Promise<void> {
    console.log(`🔄 Безопасное обновление заказа ${existingOrder.id}:`);
    console.log(`   Старые данные: кол-во=${existingOrder.quantity}, срок=${existingOrder.deadline}`);
    console.log(`   Новые данные: кол-во=${orderData.quantity}, срок=${orderData.deadline}`);

    // Обновляем только основные данные, сохраняя статус и прогресс
    existingOrder.quantity = orderData.quantity;
    existingOrder.deadline = orderData.deadline;
    existingOrder.priority = orderData.priority;
    
    // НЕ обновляем remainingQuantity если заказ уже в работе
    if (existingOrder.status === 'planned') {
      existingOrder.remainingQuantity = orderData.quantity;
      console.log(`   ↻ Обновлен remainingQuantity (статус: planned)`);
    } else {
      console.log(`   ⚠️ remainingQuantity НЕ обновлен (статус: ${existingOrder.status})`);
    }

    await this.orderRepository.save(existingOrder);

    // Операции обновляем только если заказ еще не начат
    if (existingOrder.status === 'planned' && orderData.operations.length > 0) {
      console.log(`   🔧 Обновляем операции (заказ еще не начат)`);
      
      // Удаляем старые операции и создаем новые
      await this.operationRepository.delete({ order: { id: existingOrder.id } });

      for (const opData of orderData.operations) {
        const operation = this.operationRepository.create({
          operationNumber: opData.operationNumber,
          operationType: opData.operationType,
          estimatedTime: opData.estimatedTime,
          order: existingOrder,
        });
        await this.operationRepository.save(operation);
      }
    } else {
      console.log(`   ⚠️ Операции НЕ обновлены (статус: ${existingOrder.status})`);
    }
  }

  // НОВОЕ: Интерактивное разрешение дубликатов
  async resolveDuplicateInteractively(
    drawingNumber: string,
    orderData: ParsedOrder,
    action: 'update' | 'skip'
  ): Promise<void> {
    const existingOrder = await this.ordersService.findByDrawingNumber(drawingNumber);
    
    if (!existingOrder) {
      throw new Error('Заказ не найден');
    }

    if (action === 'update') {
      await this.updateExistingOrderSafely(existingOrder, orderData);
    }
    // Для 'skip' ничего не делаем
  }
}
