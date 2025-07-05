/**
 * @file: excel-parser.service.ts
 * @description: Сервис для парсинга Excel файлов с поддержкой дефолтных колонок
 * @dependencies: nestjs, exceljs
 * @created: 2025-07-03
 * @fixed: 2025-07-04 - заменен xlsx на exceljs
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
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  // ИСПРАВЛЕННЫЕ приоритеты колонок для реального Excel файла
  private readonly COLUMN_LETTER_PRIORITY = {
    drawingNumber: ['C', 'A', 'B', 'K', 'J'], // Колонка C - маккаб (номер чертежа)
    quantity: ['E', 'D', 'F', 'L', 'M'], // Колонка E - количество (кмут)
    deadline: ['G', 'H', 'I', 'N', 'O'], // Колонка G - дедлайн (таарих аспака)
    priority: ['K', 'L', 'M', 'P', 'Q'], // Колонка K - приоритет
    workType: ['J', 'I', 'K', 'L', 'M'] // Колонка J - статус/тип работы
  };

  // Возможные названия колонок
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
      'priority', 'приоритет', 'важность', 'срочность', 'prio'
    ],
    workType: [
      'workType', 'work_type', 'тип работы', 'операция', 'обработка', 'work', 'type', 'סטטוס', 'סטטוס*', 'סטטוס *', 'status', 'תיאור', 'סוג עבודה'
    ]
  };

  constructor(
    private readonly priorityCalculatorService: PriorityCalculatorService,
  ) {}

  /**
   * Парсинг Excel файла
   */
  async parseExcelFile(fileBuffer: Buffer): Promise<ExcelParseResult> {
    this.logger.log('📈 Начало парсинга Excel файла...');
    
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
      
      // Определяем колонки
      const columnMappings = this.detectColumnMappings(rawData);
      
      // Парсим данные
      const parsedOrders: CreateOrderV2Dto[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];
          const parsedOrder = await this.parseRow(row, columnMappings, i + 1, worksheet);
          if (parsedOrder) {
            parsedOrders.push(parsedOrder);
          }
        } catch (error) {
          const errorMessage = `Строка ${i + 1}: ${error.message}`;
          errors.push(errorMessage);
          this.logger.warn(`⚠️ Ошибка парсинга: ${errorMessage}`);
        }
      }
      
      this.logger.log(`✅ Парсинг завершен: ${parsedOrders.length} заказов, ${errors.length} ошибок`);
      
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
   * Преобразование буквы колонки в номер
   */
  private letterToNumber(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + letter.charCodeAt(i) - 64;
    }
    return result;
  }

  /**
   * Определение соответствия колонок с приоритетом буквенных позиций
   */
  private detectColumnMappings(data: ExcelRow[]): ColumnMappings {
    this.logger.log('🔍 Определение соответствия колонок...');
    
    if (data.length === 0) {
      return {};
    }
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    const mappings: ColumnMappings = {};
    
    // Первый проход: ищем по приоритетным буквам (K > J > A)
    this.logger.log('🎩 Приоритетный поиск по колонкам K, L, M, N...');
    
    for (const [field, preferredLetters] of Object.entries(this.COLUMN_LETTER_PRIORITY)) {
      for (const letter of preferredLetters) {
        const columnIndex = this.letterToNumber(letter);
        if (columnIndex <= columns.length && !mappings[field as keyof ColumnMappings]) {
          const columnName = columns[columnIndex - 1];
          if (columnName) {
            // Проверяем, есть ли в колонке данные
            const hasData = data.some(row => {
              const value = row[columnName];
              return value && String(value).trim() !== '';
            });
            
            if (hasData) {
              mappings[field as keyof ColumnMappings] = columnName;
              this.logger.log(`✅ Найдено ${field} в колонке ${letter}: ${columnName}`);
              break;
            }
          }
        }
      }
    }
    
    // Второй проход: поиск по названиям для ненайденных полей
    this.logger.log('🔍 Поиск по названиям колонок...');
    
    for (const [field, aliases] of Object.entries(this.COLUMN_ALIASES)) {
      if (!mappings[field as keyof ColumnMappings]) {
        for (const column of columns) {
          const normalizedColumn = column.toLowerCase().trim();
          if (aliases.some(alias => normalizedColumn.includes(alias.toLowerCase()))) {
            mappings[field as keyof ColumnMappings] = column;
            this.logger.log(`✅ Найдено ${field} по названию: ${column}`);
            break;
          }
        }
      }
    }
    
    this.logger.log('🗺️ Найденные соответствия:', mappings);
    return mappings;
  }

  /**
   * Проверка цвета ячейки (фильтр зеленых заказов)
   */
  private isGreenCell(worksheet: ExcelJS.Worksheet, rowNumber: number, columnIndex: number): boolean {
    try {
      const cell = worksheet.getCell(rowNumber, columnIndex);
      if (cell.fill && cell.fill.type === 'pattern') {
        const fill = cell.fill as ExcelJS.FillPattern;
        if (fill.fgColor) {
          const color = typeof fill.fgColor === 'object' ? fill.fgColor.argb : fill.fgColor;
          // Проверяем на различные оттенки зеленого
          return color && (
            color.toLowerCase().includes('00ff00') || // Зеленый
            color.toLowerCase().includes('008000') || // Темно-зеленый
            color.toLowerCase().includes('90ee90') || // Светло-зеленый
            color.toLowerCase().includes('00ff7f') || // Весенне-зеленый
            color.toLowerCase().includes('32cd32') || // Лайм
            color.toLowerCase().includes('adff2f')    // Желто-зеленый
          );
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Парсинг одной строки - ИСПРАВЛЕН для V2 DTO
   */
  private async parseRow(row: ExcelRow, mappings: ColumnMappings, rowIndex: number, worksheet?: ExcelJS.Worksheet): Promise<CreateOrderV2Dto | null> {
    try {
      // Проверяем цвет ячейки с номером чертежа (если есть worksheet)
      if (worksheet && mappings.drawingNumber) {
        const columnKeys = Object.keys(row);
        const drawingColumnIndex = columnKeys.findIndex(key => key === mappings.drawingNumber) + 1;
        
        if (drawingColumnIndex > 0 && this.isGreenCell(worksheet, rowIndex + 1, drawingColumnIndex)) {
          this.logger.log(`🟢 Строка ${rowIndex}: пропускаем зеленый заказ`);
          return null; // Пропускаем зеленые заказы
        }
      }
      
      // Извлекаем данные - ИСПРАВЛЕНО для V2
      const drawingNumber = this.extractDrawingNumber(row, mappings);
      const quantity = this.extractQuantity(row, mappings);
      const deadline = this.extractDeadline(row, mappings);
      const priorityString = this.extractPriorityV2(row, mappings); // Теперь возвращаем строку
      const workTypeString = this.extractWorkType(row, mappings);
      
      // Преобразуем в enum'ы V2
      const workType = getWorkTypeFromExcel(workTypeString || 'обработка');
      const operationType = getOperationTypeFromWorkType(workType);
      
      // Проверяем обязательные поля - генерируем номер чертежа если отсутствует
      let finalDrawingNumber = drawingNumber;
      if (!finalDrawingNumber) {
        // Генерируем номер чертежа на основе данных строки
        const timestamp = Date.now();
        const hash = Math.random().toString(36).substr(2, 5).toUpperCase();
        finalDrawingNumber = `AUTO-${rowIndex}-${hash}-${timestamp}`;
        this.logger.warn(`⚠️ Строка ${rowIndex}: отсутствует номер чертежа, сгенерирован: ${finalDrawingNumber}`);
      }
      
      if (!quantity || quantity <= 0) {
        throw new Error('Некорректное количество');
      }
      
      if (!deadline) {
        throw new Error('Отсутствует дедлайн');
      }
      
      // Создаем операции V2 с правильным типом
      const operations = [{
        operationNumber: 1,
        operationType: operationType, // Определяем по workType
        machineAxes: 3,
        estimatedTime: Math.ceil(quantity * 10), // 10 минут на деталь
      }];
      
      // Формируем V2 DTO
      const orderDto: CreateOrderV2Dto = {
        drawingNumber: finalDrawingNumber,
        quantity,
        deadline,
        priority: priorityString || PriorityV2.MEDIUM, // Используем PriorityV2 enum
        workType: workType, // Используем WorkTypeV2 enum
        operations,
      };
      
      return orderDto;
    } catch (error) {
      throw new Error(`Ошибка парсинга строки ${rowIndex}: ${error.message}`);
    }
  }

  /**
   * Извлечение номера чертежа
   */
  private extractDrawingNumber(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.drawingNumber;
    
    if (!column) {
      // Попробуем найти любое поле с номером чертежа
      const possibleColumns = Object.keys(row).filter(key => {
        const val = String(key).toLowerCase();
        return this.COLUMN_ALIASES.drawingNumber.some(alias => val.includes(alias.toLowerCase()));
      });
      
      if (possibleColumns.length > 0) {
        const value = row[possibleColumns[0]];
        return value ? String(value).trim() : null;
      }
      
      return null;
    }
    
    const value = row[column];
    return value ? String(value).trim() : null;
  }

  /**
   * Извлечение количества
   */
  private extractQuantity(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.quantity;
    if (!column) return null;
    
    const value = row[column];
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Извлечение дедлайна
   */
  private extractDeadline(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.deadline;
    if (!column) {
      // Попробуем найти любое поле с датой
      const dateColumns = Object.keys(row).filter(key => {
        const val = String(key).toLowerCase();
        return this.COLUMN_ALIASES.deadline.some(alias => val.includes(alias.toLowerCase()));
      });
      
      if (dateColumns.length > 0) {
        const value = row[dateColumns[0]];
        return this.parseDate(value);
      }
      return null;
    }
    
    const value = row[column];
    if (!value) return null;
    
    return this.parseDate(value);
  }
  
  /**
   * Парсинг даты с поддержкой разных форматов
   */
  private parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      const strValue = String(value).trim();
      
      // Проверяем различные форматы дат
      
      // Формат DD/MM/YY или DD/MM/YYYY
      const ddmmyyMatch = strValue.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
      if (ddmmyyMatch) {
        let [, day, month, year] = ddmmyyMatch;
        if (year.length === 2) {
          year = '20' + year; // Предполагаем 21 век
        }
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Обычное преобразование
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      
      // Если ничего не сработало, возвращаем дефолтную дату
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30); // +30 дней
      return defaultDate.toISOString().split('T')[0];
    } catch {
      // Если все плохо, возвращаем дефолт
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate.toISOString().split('T')[0];
    }
  }

  /**
   * Извлечение приоритета (старая версия)
   */
  private extractPriority(row: ExcelRow, mappings: ColumnMappings): number | null {
    const column = mappings.priority;
    if (!column) return null;
    
    const value = row[column];
    if (!value) return null;
    
    const str = String(value).toLowerCase().trim();
    
    // Сопоставляем строки с числами (возвращаем числа, не enum)
    if (str.includes('высок') || str.includes('high') || str === '1') {
      return 1; // Priority.HIGH
    }
    if (str.includes('средн') || str.includes('medium') || str === '2') {
      return 2; // Priority.MEDIUM
    }
    if (str.includes('низк') || str.includes('low') || str === '3') {
      return 3; // Priority.LOW
    }
    if (str.includes('срочн') || str.includes('urgent') || str === '4') {
      return 4; // Priority.URGENT
    }
    
    // Пытаемся как число
    const num = Number(value);
    if (!isNaN(num) && num >= 1 && num <= 4) {
      return num;
    }
    
    return null;
  }
  
  /**
   * Извлечение приоритета V2 (возвращаем строковые enum)
   */
  private extractPriorityV2(row: ExcelRow, mappings: ColumnMappings): PriorityV2 | null {
    const column = mappings.priority;
    if (!column) return null;
    
    const value = row[column];
    if (!value) return null;
    
    const str = String(value).toLowerCase().trim();
    
    // Маппинг на PriorityV2 enum
    if (str.includes('высок') || str.includes('high') || str === '1') {
      return PriorityV2.HIGH;
    }
    if (str.includes('средн') || str.includes('medium') || str === '2') {
      return PriorityV2.MEDIUM;
    }
    if (str.includes('низк') || str.includes('low') || str === '3') {
      return PriorityV2.LOW;
    }
    if (str.includes('срочн') || str.includes('urgent') || str === '4') {
      return PriorityV2.URGENT;
    }
    
    // Пытаемся как число и маппим
    const num = Number(value);
    if (!isNaN(num)) {
      switch (num) {
        case 1: return PriorityV2.HIGH;
        case 2: return PriorityV2.MEDIUM;
        case 3: return PriorityV2.LOW;
        case 4: return PriorityV2.URGENT;
      }
    }
    
    return null;
  }

  /**
   * Извлечение типа работы
   */
  private extractWorkType(row: ExcelRow, mappings: ColumnMappings): string | null {
    const column = mappings.workType;
    if (!column) return null;
    
    const value = row[column];
    return value ? String(value).trim() : null;
  }

  /**
   * Валидация данных
   */
  async validateExcelFile(fileBuffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    this.logger.log('🔍 Валидация Excel файла...');
    
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

  /**
   * Получение примера структуры файла
   */
  getExampleFileStructure(): any {
    return {
      headers: ['Номер чертежа', 'Количество', 'Дедлайн', 'Приоритет', 'Тип работы'],
      example: [
        ['DRW-001', 10, '2024-12-31', 'Высокий', 'Фрезерование'],
        ['DRW-002', 5, '2024-11-15', 'Средний', 'Токарная обработка'],
      ],
      supportedColumns: this.COLUMN_ALIASES,
    };
  }
}
