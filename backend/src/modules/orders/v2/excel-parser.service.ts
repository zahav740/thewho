/**
 * @file: excel-parser.service.ts
 * @description: ИСПРАВЛЕННЫЙ сервис для парсинга Excel файлов с чтением реальных данных
 * @dependencies: nestjs, exceljs
 * @created: 2025-07-03
 * @fixed: 2025-07-05 - исправлено чтение операций и приоритетов из Excel
 */
import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateOrderV2Dto, PriorityV2, WorkTypeV2, OperationTypeV2 } from '../dto/create-order-v2.dto';
import { getWorkTypeFromExcel, getOperationTypeFromWorkType } from './excel-import.utils';
import { Priority } from './enums/priority.enum';
import { PriorityCalculatorService } from './priority-calculator.service';

interface ExcelRow {
  [key: string]: any;
}

interface ParsedExcelData {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority?: number;
  workType: string;
  rowIndex: number;
}

export interface ExcelParseResult {
  success: boolean;
  data: CreateOrderV2Dto[];
  totalRows: number;
  parsedRows: number;
  errors: string[];
  columnMappings: ColumnMappings;
}

interface ColumnMappings {
  drawingNumber?: string;
  quantity?: string;
  deadline?: string;
  priority?: string;
  workType?: string;
  operationsTime?: string;
  operationsCount?: string;
  machineAxes?: string;
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  // ИСПРАВЛЕННЫЕ приоритеты колонок для реального Excel файла
  private readonly COLUMN_LETTER_PRIORITY = {
    drawingNumber: ['A', 'B', 'C', 'K', 'J'], // Первые колонки для номера чертежа
    quantity: ['D', 'E', 'F', 'L', 'M'], // Количество
    deadline: ['G', 'H', 'I', 'N', 'O'], // Дедлайн
    priority: ['J', 'K', 'L', 'P', 'Q'], // Приоритет
    workType: ['I', 'J', 'K', 'L', 'M'], // Тип работы/статус
    operationsTime: ['F', 'G', 'H', 'M', 'N'], // Время операций
    operationsCount: ['B', 'C', 'D', 'H', 'I'], // Количество операций
    machineAxes: ['E', 'F', 'G', 'J', 'K'] // Количество осей станка
  };

  // Расширенные алиасы колонок для поиска данных
  private readonly COLUMN_ALIASES = {
    drawingNumber: [
      'drawingNumber', 'drawing_number', 'номер чертежа', 'чертеж', 'drawing', 'drw',
      'деталь', 'код детали', 'номер детали', 'изделие', 'מקט', 'מק"ט', 'מקט"', 'part_number',
      'מק"ט *', 'מק"ט*', '* מק"ט', '*מק"ט', 'מק"ט:', ':מק"ט', 'item', 'партномер'
    ],
    quantity: [
      'quantity', 'количество', 'кол-во', 'кол', 'qty', 'count', 'amount', 'כמות', 'כמות*', '* כמות', '*כמות'
    ],
    deadline: [
      'deadline', 'дедлайн', 'срок', 'срок выполнения', 'дата сдачи', 'date',
      'готовность', 'выполнение', 'completion', 'ת.אספקה', 'ת.סיום ייצור', 'דדליין', 'תאריך אספקה', 'תאריך'
    ],
    priority: [
      'priority', 'приоритет', 'важность', 'срочность', 'prio', 'דחיפות', 'עדיפות'
    ],
    workType: [
      'workType', 'work_type', 'тип работы', 'операция', 'обработка', 'work', 'type', 
      'סטטוס', 'סטטוס*', 'סטטוס *', 'status', 'תיאור', 'סוג עבודה', 'machine', 'станок'
    ],
    operationsTime: [
      'time', 'время', 'duration', 'minutes', 'mins', 'мин', 'продолжительность', 'זמן', 'דקות'
    ],
    operationsCount: [
      'operations', 'операции', 'ops', 'количество операций', 'מספר פעולות', 'פעולות'
    ],
    machineAxes: [
      'axes', 'оси', 'axis', 'количество осей', 'צירים', 'מספר צירים'
    ]
  };

  constructor(
    private readonly priorityCalculatorService: PriorityCalculatorService,
  ) {}

  /**
   * Парсинг Excel файла с чтением реальных данных
   */
  async parseExcelFile(fileBuffer: Buffer): Promise<ExcelParseResult> {
    this.logger.log('📈 ИСПРАВЛЕННЫЙ парсинг Excel файла...');
    
    try {
      // Читаем файл через ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Не найдено листов в файле');
      }
      
      // Преобразуем в JSON
      const rawData: ExcelRow[] = [];
      const headers: string[] = [];
      
      // Читаем заголовки из первой строки
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.text || cell.value?.toString() || '';
      });
      
      this.logger.log('📋 Найденные заголовки:', headers);
      
      // Читаем данные со второй строки
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData: ExcelRow = {};
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.text || cell.value;
          }
        });
        
        // Пропускаем пустые строки
        if (Object.values(rowData).some(value => value !== null && value !== undefined && value !== '')) {
          rawData.push(rowData);
        }
      }
      
      this.logger.log(`📈 Найдено ${rawData.length} строк в файле`);
      
      // Определяем колонки с улучшенным поиском
      const columnMappings = this.detectColumnMappingsImproved(rawData, headers);
      this.logger.log('🗺️ Обнаруженные колонки:', columnMappings);
      
      // Парсим данные с реальными операциями
      const parsedOrders: CreateOrderV2Dto[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const parsedOrder = await this.parseRowWithRealData(row, columnMappings, i + 1, worksheet);
          if (parsedOrder) {
            parsedOrders.push(parsedOrder);
            this.logger.log(`✅ Строка ${i + 1}: ${parsedOrder.drawingNumber} - приоритет: ${parsedOrder.priority}`);
          }
        } catch (error) {
          const errorMessage = `Строка ${i + 1}: ${error.message}`;
          errors.push(errorMessage);
          this.logger.warn(`⚠️ Ошибка парсинга: ${errorMessage}`);
        }
      }
      
      this.logger.log(`✅ ИСПРАВЛЕННЫЙ парсинг завершен: ${parsedOrders.length} заказов, ${errors.length} ошибок`);
      
      return {
        success: parsedOrders.length > 0,
        data: parsedOrders,
        totalRows: rawData.length,
        parsedRows: parsedOrders.length,
        errors,
        columnMappings,
      };
    } catch (error) {
      this.logger.error('❌ Ошибка парсинга Excel файла:', error);
      throw new Error(`Ошибка парсинга файла: ${error.message}`);
    }
  }

  /**
   * Улучшенное определение соответствия колонок
   */
  private detectColumnMappingsImproved(data: ExcelRow[], headers: string[]): ColumnMappings {
    this.logger.log('🔍 УЛУЧШЕННОЕ определение соответствия колонок...');
    
    if (data.length === 0) {
      return {};
    }
    
    const mappings: ColumnMappings = {};
    
    // Анализируем все возможные поля
    const fieldsToFind = [
      'drawingNumber', 'quantity', 'deadline', 'priority', 
      'workType', 'operationsTime', 'operationsCount', 'machineAxes'
    ];
    
    for (const field of fieldsToFind) {
      const aliases = this.COLUMN_ALIASES[field] || [];
      
      // Ищем по названиям колонок
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().trim();
        
        if (aliases.some(alias => normalizedHeader.includes(alias.toLowerCase()))) {
          // Проверяем, есть ли в колонке данные
          const hasData = data.some(row => {
            const value = row[header];
            return value && String(value).trim() !== '';
          });
          
          if (hasData && !mappings[field as keyof ColumnMappings]) {
            mappings[field as keyof ColumnMappings] = header;
            this.logger.log(`✅ Найдено ${field} в колонке: ${header}`);
            break;
          }
        }
      }
      
      // Если не нашли по названию, ищем по содержимому
      if (!mappings[field as keyof ColumnMappings] && field === 'priority') {
        for (const header of headers) {
          const hasNumericalPriority = data.some(row => {
            const value = row[header];
            const num = Number(value);
            return !isNaN(num) && num >= 1 && num <= 4;
          });
          
          if (hasNumericalPriority) {
            mappings.priority = header;
            this.logger.log(`✅ Найден приоритет по содержимому в колонке: ${header}`);
            break;
          }
        }
      }
    }
    
    return mappings;
  }

  /**
   * Парсинг строки с чтением реальных данных операций
   */
  private async parseRowWithRealData(
    row: ExcelRow, 
    mappings: ColumnMappings, 
    rowIndex: number, 
    worksheet?: ExcelJS.Worksheet
  ): Promise<CreateOrderV2Dto | null> {
    try {
      // Проверяем цвет ячейки (пропускаем зеленые заказы)
      if (worksheet && mappings.drawingNumber) {
        const columnKeys = Object.keys(row);
        const drawingColumnIndex = columnKeys.findIndex(key => key === mappings.drawingNumber) + 1;
        
        if (drawingColumnIndex > 0 && this.isGreenCell(worksheet, rowIndex + 1, drawingColumnIndex)) {
          this.logger.log(`🟢 Строка ${rowIndex}: пропускаем зеленый заказ`);
          return null;
        }
      }
      
      // Извлекаем основные данные
      const drawingNumber = this.extractDrawingNumber(row, mappings) || this.generateDrawingNumber(rowIndex);
      const quantity = this.extractQuantity(row, mappings) || 1;
      const deadline = this.extractDeadline(row, mappings) || this.getDefaultDeadline();
      
      // ИСПРАВЛЕНО: читаем приоритет из файла
      const priorityFromFile = this.extractPriorityV2FromFile(row, mappings);
      const priority = priorityFromFile || PriorityV2.MEDIUM;
      
      // ИСПРАВЛЕНО: читаем тип работы из файла
      const workTypeString = this.extractWorkType(row, mappings);
      const workType = getWorkTypeFromExcel(workTypeString || 'фрезерная обработка');
      
      // ИСПРАВЛЕНО: читаем реальные операции из файла
      const operations = this.extractOperationsFromFile(row, mappings, workType, quantity);
      
      this.logger.log(`📋 Строка ${rowIndex}: ${drawingNumber} - приоритет из файла: ${priority}, операций: ${operations.length}`);
      
      // Формируем DTO с реальными данными
      const orderDto: CreateOrderV2Dto = {
        drawingNumber,
        quantity,
        deadline,
        priority,
        workType,
        operations,
      };
      
      return orderDto;
    } catch (error) {
      throw new Error(`Ошибка парсинга строки ${rowIndex}: ${error.message}`);
    }
  }

  /**
   * ИСПРАВЛЕНО: Извлечение приоритета из файла
   */
  private extractPriorityV2FromFile(row: ExcelRow, mappings: ColumnMappings): PriorityV2 | null {
    const column = mappings.priority;
    if (!column) {
      // Пытаемся найти приоритет в любой колонке
      for (const [key, value] of Object.entries(row)) {
        if (value) {
          const str = String(value).toLowerCase().trim();
          if (str.includes('высок') || str.includes('high') || str === '1') return PriorityV2.HIGH;
          if (str.includes('средн') || str.includes('medium') || str === '2') return PriorityV2.MEDIUM;
          if (str.includes('низк') || str.includes('low') || str === '3') return PriorityV2.LOW;
          if (str.includes('срочн') || str.includes('urgent') || str === '4') return PriorityV2.URGENT;
        }
      }
      return null;
    }
    
    const value = row[column];
    if (!value) return null;
    
    const str = String(value).toLowerCase().trim();
    
    // Подробное логирование приоритета
    this.logger.log(`🎯 Анализ приоритета: значение="${value}", строка="${str}"`);
    
    // Маппинг на PriorityV2 enum
    if (str.includes('высок') || str.includes('high') || str === '1') {
      this.logger.log(`🔴 Определен приоритет: HIGH`);
      return PriorityV2.HIGH;
    }
    if (str.includes('средн') || str.includes('medium') || str === '2') {
      this.logger.log(`🟡 Определен приоритет: MEDIUM`);
      return PriorityV2.MEDIUM;
    }
    if (str.includes('низк') || str.includes('low') || str === '3') {
      this.logger.log(`🟢 Определен приоритет: LOW`);
      return PriorityV2.LOW;
    }
    if (str.includes('срочн') || str.includes('urgent') || str === '4') {
      this.logger.log(`🚨 Определен приоритет: URGENT`);
      return PriorityV2.URGENT;
    }
    
    // Пытаемся как число
    const num = Number(value);
    if (!isNaN(num)) {
      switch (num) {
        case 1: 
          this.logger.log(`🔴 Определен числовой приоритет: HIGH (1)`);
          return PriorityV2.HIGH;
        case 2: 
          this.logger.log(`🟡 Определен числовой приоритет: MEDIUM (2)`);
          return PriorityV2.MEDIUM;
        case 3: 
          this.logger.log(`🟢 Определен числовой приоритет: LOW (3)`);
          return PriorityV2.LOW;
        case 4: 
          this.logger.log(`🚨 Определен числовой приоритет: URGENT (4)`);
          return PriorityV2.URGENT;
      }
    }
    
    this.logger.log(`❓ Приоритет не распознан: "${value}"`);
    return null;
  }

  /**
   * ИСПРАВЛЕНО: Извлечение реальных операций из файла
   */
  private extractOperationsFromFile(
    row: ExcelRow, 
    mappings: ColumnMappings, 
    workType: WorkTypeV2, 
    quantity: number
  ): any[] {
    // Пытаемся найти данные об операциях в файле
    const operationsTime = this.extractOperationsTime(row, mappings);
    const operationsCount = this.extractOperationsCount(row, mappings);
    const machineAxes = this.extractMachineAxes(row, mappings);
    
    this.logger.log(`🔧 Данные операций из файла: время=${operationsTime}, количество=${operationsCount}, оси=${machineAxes}`);
    
    // Определяем тип операции
    const operationType = getOperationTypeFromWorkType(workType);
    
    // Если есть реальные данные из файла, используем их
    if (operationsTime || operationsCount) {
      const finalTime = operationsTime || (quantity * 15); // 15 минут на деталь по умолчанию
      const finalCount = operationsCount || 1;
      const finalAxes = machineAxes || 3;
      
      const operations = [];
      for (let i = 1; i <= finalCount; i++) {
        operations.push({
          operationNumber: i,
          operationType: operationType,
          machineAxes: finalAxes,
          estimatedTime: Math.ceil(finalTime / finalCount), // Распределяем время по операциям
        });
      }
      
      this.logger.log(`✅ Созданы операции из файла: ${operations.length} операций`);
      return operations;
    }
    
    // Если данных нет, создаем минимальную операцию
    this.logger.log(`⚠️ Данные операций не найдены, создаем базовую операцию`);
    return [{
      operationNumber: 1,
      operationType: operationType,
      machineAxes: 3,
      estimatedTime: Math.ceil(quantity * 10), // 10 минут на деталь
    }];
  }

  /**
   * Извлечение времени операций из файла
   */
  private extractOperationsTime(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.operationsTime;
    if (column) {
      const value = row[column];
      const num = Number(value);
      if (!isNaN(num) && num > 0) {
        this.logger.log(`⏱️ Найдено время операций: ${num} минут`);
        return num;
      }
    }
    
    // Ищем время в любой колонке
    for (const [key, value] of Object.entries(row)) {
      if (value) {
        const str = String(value).toLowerCase();
        if (str.includes('мин') || str.includes('час') || str.includes('время')) {
          const num = Number(value.toString().replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) {
            this.logger.log(`⏱️ Найдено время в колонке ${key}: ${num}`);
            return num;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Извлечение количества операций из файла
   */
  private extractOperationsCount(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.operationsCount;
    if (column) {
      const value = row[column];
      const num = Number(value);
      if (!isNaN(num) && num > 0 && num <= 10) { // Разумное количество операций
        this.logger.log(`🔢 Найдено количество операций: ${num}`);
        return num;
      }
    }
    return null;
  }

  /**
   * Извлечение количества осей станка из файла
   */
  private extractMachineAxes(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.machineAxes;
    if (column) {
      const value = row[column];
      const num = Number(value);
      if (!isNaN(num) && num >= 3 && num <= 5) { // 3-5 осей
        this.logger.log(`⚙️ Найдено количество осей: ${num}`);
        return num;
      }
    }
    return null;
  }

  /**
   * Проверка цвета ячейки
   */
  private isGreenCell(worksheet: ExcelJS.Worksheet, rowNumber: number, columnIndex: number): boolean {
    try {
      const cell = worksheet.getCell(rowNumber, columnIndex);
      if (cell.fill && cell.fill.type === 'pattern') {
        const fill = cell.fill as ExcelJS.FillPattern;
        if (fill.fgColor) {
          const color = typeof fill.fgColor === 'object' ? fill.fgColor.argb : fill.fgColor;
          return color && (
            color.toLowerCase().includes('00ff00') ||
            color.toLowerCase().includes('008000') ||
            color.toLowerCase().includes('90ee90') ||
            color.toLowerCase().includes('00ff7f') ||
            color.toLowerCase().includes('32cd32') ||
            color.toLowerCase().includes('adff2f')
          );
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Генерация номера чертежа
   */
  private generateDrawingNumber(rowIndex: number): string {
    const timestamp = Date.now();
    const hash = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `AUTO-${rowIndex}-${hash}-${timestamp}`;
  }

  /**
   * Получение дефолтного дедлайна
   */
  private getDefaultDeadline(): string {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString().split('T')[0];
  }

  // Остальные методы остаются без изменений...
  private extractDrawingNumber(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.drawingNumber;
    if (!column) return null;
    
    const value = row[column];
    return value ? String(value).trim() : null;
  }

  private extractQuantity(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.quantity;
    if (!column) return null;
    
    const value = row[column];
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private extractDeadline(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.deadline;
    if (!column) return null;
    
    const value = row[column];
    if (!value) return null;
    
    return this.parseDate(value);
  }

  private parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate.toISOString().split('T')[0];
    } catch {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate.toISOString().split('T')[0];
    }
  }

  private extractWorkType(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.workType;
    if (!column) return null;
    
    const value = row[column];
    return value ? String(value).trim() : null;
  }

  async validateExcelFile(fileBuffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const result = await this.parseExcelFile(fileBuffer);
      return {
        valid: result.success && result.errors.length === 0,
        errors: result.errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  getExampleFileStructure(): any {
    return {
      headers: ['Номер чертежа', 'Количество', 'Дедлайн', 'Приоритет', 'Тип работы', 'Время операций'],
      example: [
        ['CN3F2001A', 3, '2023-10-01', 'Высокий', 'Фрезерная обработка', '60'],
        ['RE1K0022A', 200, '2024-09-03', 'Средний', 'Токарная обработка', '2000'],
      ],
      supportedColumns: this.COLUMN_ALIASES,
    };
  }
}
