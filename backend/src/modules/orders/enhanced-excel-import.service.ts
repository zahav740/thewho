/**
 * @file: enhanced-excel-import.service.ts
 * @description: УЛУЧШЕННЫЙ сервис импорта Excel с поддержкой фильтров и полной загрузки в БД
 * @dependencies: exceljs, orders.service
 * @created: 2025-06-09
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Order, Priority } from '../../database/entities/order.entity';
import { Operation, OperationType } from '../../database/entities/operation.entity';
import { OrdersService } from './orders.service';
import type { MulterFile } from '../../types/express';


export interface ColorFilter {
  color: string;
  label: string;
  description: string;
  priority: number;
  selected: boolean;
}

export interface ImportSettings {
  colorFilters: ColorFilter[];
  columnMapping: ColumnMapping[];
  importOnlySelected: boolean;
  clearExistingData?: boolean;
  skipDuplicates?: boolean;
}

export interface ColumnMapping {
  fieldName: string;
  excelColumn: string;
  description: string;
  required?: boolean;
}

export interface EnhancedImportResult {
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  created: number;
  updated: number;
  duplicatesSkipped: number;
  errors: Array<{ row: number; order: string; error: string; color?: string }>;
  colorStatistics: Record<string, number>;
  summary: {
    greenOrders: number;   // Готовые к производству
    yellowOrders: number;  // Обычные заказы
    redOrders: number;     // Критичные заказы
    blueOrders: number;    // Плановые заказы
  };
  filters: {
    applied: ColorFilter[];
    total: number;
    selected: number;
  };
}

interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: Priority;
  workType?: string;
  rowColor?: string;
  rowNumber: number;
  operations: Array<{
    operationNumber: number;
    operationType: OperationType;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

@Injectable()
export class EnhancedExcelImportService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * ОСНОВНОЙ МЕТОД: Полный импорт Excel файла с применением фильтров
   */
  async importFullExcelWithFilters(
    file: Express.Multer.File,
    settings: ImportSettings,
  ): Promise<EnhancedImportResult> {
    console.log('🚀 ПОЛНЫЙ ИМПОРТ EXCEL: Начало обработки файла:', {
      originalname: file.originalname,
      size: file.size,
      hasBuffer: !!file.buffer,
      bufferSize: file.buffer?.length,
      importSettings: {
        colorFiltersCount: settings.colorFilters.length,
        selectedFiltersCount: settings.colorFilters.filter(f => f.selected).length,
        importOnlySelected: settings.importOnlySelected,
        clearExisting: settings.clearExistingData,
        skipDuplicates: settings.skipDuplicates
      }
    });

    // Валидация файла
    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    // Очистка существующих данных если требуется
    if (settings.clearExistingData) {
      console.log('🗑️ Очищаем существующие данные...');
      await this.clearExistingOrders();
    }

    // Парсинг Excel файла
    const { orders, errors, statistics } = await this.parseExcelWithColors(file, settings);

    // Импорт в базу данных
    const importResult = await this.importOrdersToDatabase(orders, errors, settings);

    // Подготовка финального результата
    const enhancedResult: EnhancedImportResult = {
      ...importResult,
      colorStatistics: statistics.colorCounts,
      summary: statistics.summary,
      filters: {
        applied: settings.colorFilters.filter(f => f.selected),
        total: settings.colorFilters.length,
        selected: settings.colorFilters.filter(f => f.selected).length
      }
    };

    console.log('✅ ПОЛНЫЙ ИМПОРТ ЗАВЕРШЕН:', enhancedResult);
    
    return enhancedResult;
  }

  /**
   * Парсинг Excel файла с определением цветов и применением фильтров
   */
  private async parseExcelWithColors(
    file: Express.Multer.File,
    settings: ImportSettings
  ): Promise<{
    orders: ParsedOrder[];
    errors: Array<{ row: number; order: string; error: string; color?: string }>;
    statistics: {
      colorCounts: Record<string, number>;
      summary: { greenOrders: number; yellowOrders: number; redOrders: number; blueOrders: number };
    };
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден');
    }

    console.log('📊 Анализ структуры Excel:', {
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    });

    const orders: ParsedOrder[] = [];
    const errors: Array<{ row: number; order: string; error: string; color?: string }> = [];
    const colorCounts: Record<string, number> = { green: 0, yellow: 0, red: 0, blue: 0, other: 0 };

    // Обрабатываем каждую строку
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        
        // Определяем цвет строки
        const rowColor = this.determineRowColor(row);
        colorCounts[rowColor] = (colorCounts[rowColor] || 0) + 1;

        // Проверяем, нужно ли обрабатывать эту строку согласно фильтрам
        if (this.shouldProcessRowByFilters(row, rowColor, settings)) {
          const order = this.parseRowToOrder(row, rowNumber, rowColor);
          if (order) {
            orders.push(order);
            console.log(`✅ Строка ${rowNumber}: ${order.drawingNumber} (${rowColor})`);
          }
        } else {
          console.log(`🎨 Пропускаем строку ${rowNumber} (${rowColor}, не в фильтре)`);
        }
      } catch (error) {
        console.error(`❌ Ошибка в строке ${rowNumber}:`, error.message);
        errors.push({
          row: rowNumber,
          order: `Строка ${rowNumber}`,
          error: error.message,
          color: 'unknown'
        });
      }
    }

    const summary = {
      greenOrders: colorCounts.green || 0,
      yellowOrders: colorCounts.yellow || 0,
      redOrders: colorCounts.red || 0,
      blueOrders: colorCounts.blue || 0
    };

    console.log('📈 Статистика по цветам:', colorCounts);
    console.log('📋 Обработано заказов:', orders.length);

    return { orders, errors, statistics: { colorCounts, summary } };
  }

  /**
   * Определение цвета строки на основе различных критериев
   */
  private determineRowColor(row: ExcelJS.Row): string {
    // 1. Проверяем цвет ячейки (если есть)
    const firstCell = row.getCell(1);
    const cellColor = this.getCellColor(firstCell);
    if (cellColor) return cellColor;

    // 2. Определяем по содержимому ячеек
    const values = [];
    for (let i = 1; i <= Math.min(10, row.cellCount); i++) {
      const cellValue = row.getCell(i).value;
      if (cellValue) {
        values.push(String(cellValue).toLowerCase());
      }
    }

    const allText = values.join(' ');

    // Логика определения цвета по тексту
    if (allText.includes('готов') || allText.includes('ready') || allText.includes('completed') || allText.includes('done')) {
      return 'green'; // Готовые заказы
    } else if (allText.includes('критич') || allText.includes('срочн') || allText.includes('critical') || allText.includes('urgent')) {
      return 'red'; // Критичные заказы
    } else if (allText.includes('план') || allText.includes('plan') || allText.includes('scheduled')) {
      return 'blue'; // Плановые заказы
    } else {
      return 'yellow'; // Обычные заказы по умолчанию
    }
  }

  /**
   * Извлечение цвета ячейки
   */
  private getCellColor(cell: ExcelJS.Cell): string | null {
    try {
      const fill = cell.style?.fill;
      if (fill && fill.type === 'pattern') {
        const patternFill = fill as ExcelJS.FillPattern;
        const argb = patternFill.fgColor?.argb;
        
        if (argb) {
          // Маппинг популярных цветов Excel
          const colorMap: Record<string, string> = {
            'FF00FF00': 'green',   // Зеленый
            'FF92D050': 'green',   // Светло-зеленый
            'FFFFFF00': 'yellow',  // Желтый
            'FFFFCC00': 'yellow',  // Желто-оранжевый
            'FFFF0000': 'red',     // Красный
            'FFFF6666': 'red',     // Светло-красный
            'FF0000FF': 'blue',    // Синий
            'FF6699CC': 'blue',    // Светло-синий
          };
          
          return colorMap[argb] || null;
        }
      }
    } catch (error) {
      // Игнорируем ошибки определения цвета
    }
    
    return null;
  }

  /**
   * Проверка, нужно ли обрабатывать строку согласно фильтрам
   */
  private shouldProcessRowByFilters(
    row: ExcelJS.Row, 
    rowColor: string, 
    settings: ImportSettings
  ): boolean {
    // Если не используем цветовые фильтры, обрабатываем все строки
    if (!settings.importOnlySelected) {
      return true;
    }

    // Проверяем, выбран ли цвет этой строки в фильтрах
    const selectedColors = settings.colorFilters
      .filter(filter => filter.selected)
      .map(filter => filter.color);

    return selectedColors.includes(rowColor);
  }

  /**
   * Парсинг строки в объект заказа
   * ОБНОВЛЕНО: Используем правильный маппинг колонок C, E, H, K
   */
  private parseRowToOrder(row: ExcelJS.Row, rowNumber: number, rowColor: string): ParsedOrder | null {
    // ПРАВИЛЬНЫЙ МАППИНГ: C=номер чертежа, E=количество, H=срок, K=приоритет
    const drawingNumber = row.getCell('C').value?.toString()?.trim(); // Колонка C
    if (!drawingNumber) return null;

    const quantity = parseInt(row.getCell('E').value?.toString() || '1', 10); // Колонка E
    const deadline = this.parseDate(row.getCell('H').value); // Колонка H
    const priority = this.parsePriorityFromColorAndText(rowColor, row.getCell('K').value?.toString()); // Колонка K
    const workType = row.getCell('F').value?.toString()?.trim() || 'Не указан'; // Колонка F для типа работы

    // Парсим операции (колонки после K)
    const operations = this.parseOperations(row);

    console.log(`📋 Парсинг строки ${rowNumber}: Чертеж=${drawingNumber}, Кол-во=${quantity}, Срок=${deadline?.toLocaleDateString()}, Приоритет=${priority}`);

    return {
      drawingNumber,
      quantity,
      deadline,
      priority,
      workType,
      rowColor,
      rowNumber,
      operations,
    };
  }

  /**
   * Определение приоритета на основе цвета и текста
   */
  private parsePriorityFromColorAndText(color: string, priorityText?: string): Priority {
    // Сначала проверяем текст
    if (priorityText) {
      const text = priorityText.toLowerCase();
      if (text.includes('1') || text.includes('критич') || text.includes('critical')) {
        return Priority.HIGH;
      } else if (text.includes('2') || text.includes('высок') || text.includes('high')) {
        return Priority.HIGH;
      } else if (text.includes('3') || text.includes('средн') || text.includes('medium')) {
        return Priority.MEDIUM;
      } else if (text.includes('4') || text.includes('низк') || text.includes('low')) {
        return Priority.LOW;
      }
    }

    // Если текста нет, определяем по цвету
    const colorToPriority: Record<string, Priority> = {
      red: Priority.HIGH,      // Красный = высокий приоритет
      green: Priority.MEDIUM,  // Зеленый = средний (готовые)
      yellow: Priority.MEDIUM, // Желтый = средний (обычные)
      blue: Priority.LOW,      // Синий = низкий (плановые)
    };

    return colorToPriority[color] || Priority.MEDIUM;
  }

  /**
   * Парсинг даты из различных форматов
   */
  private parseDate(value: any): Date {
    if (value instanceof Date) return value;
    
    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }

    // По умолчанию - через месяц
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    return defaultDate;
  }

  /**
   * Парсинг операций из строки
   * ОБНОВЛЕНО: Операции начинаются после колонки K (11)
   */
  private parseOperations(row: ExcelJS.Row): ParsedOrder['operations'] {
    const operations: ParsedOrder['operations'] = [];
    
    // Операции начинаются с колонки L (12) - после K
    for (let i = 12; i <= Math.min(30, row.cellCount); i += 4) {
      const operationNumber = parseInt(row.getCell(i).value?.toString() || '0', 10);
      if (!operationNumber) break;

      const operationType = this.parseOperationType(row.getCell(i + 1).value?.toString());
      const machineAxes = parseInt(row.getCell(i + 2).value?.toString() || '3', 10);
      const estimatedTime = parseInt(row.getCell(i + 3).value?.toString() || '60', 10);

      operations.push({
        operationNumber,
        operationType,
        machineAxes,
        estimatedTime,
      });
    }

    // Если операций нет, создаем стандартную
    if (operations.length === 0) {
      operations.push({
        operationNumber: 1,
        operationType: OperationType.MILLING,
        machineAxes: 3,
        estimatedTime: 60,
      });
    }

    return operations;
  }

  /**
   * Парсинг типа операции
   */
  private parseOperationType(value?: string): OperationType {
    if (!value) return OperationType.MILLING;

    const text = value.toLowerCase();
    if (text.includes('ток') || text.includes('turn') || text.includes('т')) {
      return OperationType.TURNING;
    }
    
    return OperationType.MILLING; // По умолчанию
  }

  /**
   * Импорт заказов в базу данных
   */
  private async importOrdersToDatabase(
    orders: ParsedOrder[],
    existingErrors: Array<{ row: number; order: string; error: string; color?: string }>,
    settings: ImportSettings
  ): Promise<{
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    created: number;
    updated: number;
    duplicatesSkipped: number;
    errors: Array<{ row: number; order: string; error: string; color?: string }>;
  }> {
    const result = {
      totalRows: orders.length,
      processedRows: 0,
      skippedRows: 0,
      created: 0,
      updated: 0,
      duplicatesSkipped: 0,
      errors: [...existingErrors],
    };

    console.log(`📥 Импортируем ${orders.length} заказов в базу данных...`);

    for (const orderData of orders) {
      try {
        // Проверяем существующий заказ
        const existingOrder = await this.ordersService.findByDrawingNumber(orderData.drawingNumber);

        if (existingOrder && settings.skipDuplicates) {
          result.duplicatesSkipped++;
          console.log(`⏭️ Пропускаем дубликат: ${orderData.drawingNumber}`);
          continue;
        }

        if (existingOrder) {
          await this.updateExistingOrder(existingOrder, orderData);
          result.updated++;
          console.log(`🔄 Обновлен: ${orderData.drawingNumber}`);
        } else {
          await this.createNewOrder(orderData);
          result.created++;
          console.log(`✨ Создан: ${orderData.drawingNumber}`);
        }

        result.processedRows++;

      } catch (error) {
        console.error(`❌ Ошибка импорта заказа ${orderData.drawingNumber}:`, error.message);
        result.errors.push({
          row: orderData.rowNumber,
          order: orderData.drawingNumber,
          error: error.message,
          color: orderData.rowColor
        });
        result.skippedRows++;
      }
    }

    console.log('📊 Результат импорта:', result);
    return result;
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
        sequenceNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        order: savedOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  /**
   * Обновление существующего заказа
   */
  private async updateExistingOrder(existingOrder: Order, orderData: ParsedOrder): Promise<void> {
    existingOrder.quantity = orderData.quantity;
    existingOrder.remainingQuantity = orderData.quantity;
    existingOrder.deadline = orderData.deadline;
    existingOrder.priority = orderData.priority;
    existingOrder.workType = orderData.workType;

    await this.orderRepository.save(existingOrder);

    // Обновляем операции
    await this.operationRepository.delete({ order: { id: existingOrder.id } });

    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        sequenceNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        order: existingOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  /**
   * Очистка существующих заказов
   */
  private async clearExistingOrders(): Promise<void> {
    console.log('🗑️ Удаляем все существующие заказы и операции...');
    
    await this.operationRepository.delete({});
    await this.orderRepository.delete({});
    
    console.log('✅ Очистка завершена');
  }
}
