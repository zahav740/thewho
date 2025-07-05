/**
 * @file: excel-column-mapper.service.ts
 * @description: Сервис для анализа колонок Excel и настройки маппинга
 * @dependencies: exceljs
 * @created: 2025-06-25
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { MulterFile } from '../../types/express';


export interface ExcelColumnInfo {
  columnIndex: number;
  columnLetter: string;
  header: string;
  sampleValues: string[];
  detectedType: 'text' | 'number' | 'date' | 'unknown';
  suggestedMapping: string | null;
  confidence: number; // 0-100%
}

export interface ExcelSheetInfo {
  sheetName: string;
  sheetIndex: number;
  rowCount: number;
  columnCount: number;
  columns: ExcelColumnInfo[];
}

export interface ExcelFileAnalysis {
  fileName: string;
  sheets: ExcelSheetInfo[];
  recommendedSheet: number;
  availableMappings: string[];
}

export interface ColumnMapping {
  drawingNumber?: number;
  quantity?: number;
  deadline?: number;
  priority?: number;
  workType?: number;
  operations?: {
    startColumn: number;
    columnsPerOperation: number;
    maxOperations: number;
  };
}

export interface ExcelImportSettings {
  sheetIndex: number;
  hasHeaders: boolean;
  startRow: number;
  columnMapping: ColumnMapping;
  colorFilters?: string[];
}

@Injectable()
export class ExcelColumnMapperService {

  /**
   * Анализ структуры Excel файла для выбора колонок
   */
  async analyzeExcelStructure(file: MulterFile): Promise<ExcelFileAnalysis> {
    console.log('🔍 АНАЛИЗ СТРУКТУРЫ EXCEL:', {
      fileName: file.originalname,
      size: file.size,
      hasBuffer: !!file.buffer
    });

    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const sheets: ExcelSheetInfo[] = [];
    let recommendedSheet = 0;
    let maxRows = 0;

    // Анализируем все листы
    workbook.worksheets.forEach((worksheet, index) => {
      if (worksheet.rowCount > maxRows) {
        maxRows = worksheet.rowCount;
        recommendedSheet = index;
      }

      const sheetInfo: ExcelSheetInfo = {
        sheetName: worksheet.name,
        sheetIndex: index,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        columns: this.analyzeColumns(worksheet)
      };

      sheets.push(sheetInfo);
    });

    return {
      fileName: file.originalname,
      sheets,
      recommendedSheet,
      availableMappings: [
        'drawingNumber',
        'quantity', 
        'deadline',
        'priority',
        'workType',
        'operations'
      ]
    };
  }

  /**
   * Анализ колонок конкретного листа
   */
  private analyzeColumns(worksheet: ExcelJS.Worksheet): ExcelColumnInfo[] {
    const columns: ExcelColumnInfo[] = [];
    const maxColumnsToAnalyze = Math.min(20, worksheet.columnCount);

    for (let colIndex = 1; colIndex <= maxColumnsToAnalyze; colIndex++) {
      const columnLetter = this.numberToLetter(colIndex);
      
      // Получаем заголовок (первая строка)
      const header = worksheet.getCell(1, colIndex).value?.toString()?.trim() || `Колонка ${columnLetter}`;
      
      // Получаем примеры значений (строки 2-6)
      const sampleValues: string[] = [];
      for (let rowIndex = 2; rowIndex <= Math.min(6, worksheet.rowCount); rowIndex++) {
        const cellValue = worksheet.getCell(rowIndex, colIndex).value;
        if (cellValue !== null && cellValue !== undefined) {
          sampleValues.push(String(cellValue).trim());
        }
      }

      // Определяем тип данных
      const detectedType = this.detectColumnType(sampleValues);
      
      // Предлагаем маппинг
      const { suggestedMapping, confidence } = this.suggestMapping(header, sampleValues, detectedType);

      columns.push({
        columnIndex: colIndex,
        columnLetter,
        header,
        sampleValues: sampleValues.slice(0, 3), // Показываем только первые 3 примера
        detectedType,
        suggestedMapping,
        confidence
      });
    }

    return columns;
  }

  /**
   * Определение типа данных колонки
   */
  private detectColumnType(values: string[]): 'text' | 'number' | 'date' | 'unknown' {
    if (values.length === 0) return 'unknown';

    let numNumbers = 0;
    let numDates = 0;
    let numText = 0;

    for (const value of values) {
      if (!isNaN(Number(value)) && value.trim() !== '') {
        numNumbers++;
      } else if (this.isDateLike(value)) {
        numDates++;
      } else if (value.trim() !== '') {
        numText++;
      }
    }

    const total = values.length;
    if (numNumbers / total > 0.7) return 'number';
    if (numDates / total > 0.5) return 'date';
    if (numText / total > 0.5) return 'text';
    
    return 'unknown';
  }

  /**
   * Проверка, похоже ли значение на дату
   */
  private isDateLike(value: string): boolean {
    // Простые проверки на форматы дат
    const datePatterns = [
      /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/,  // DD.MM.YYYY, DD/MM/YYYY
      /^\d{4}[./-]\d{1,2}[./-]\d{1,2}$/,    // YYYY.MM.DD, YYYY/MM/DD
      /^\d{1,2}\s+(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)/i, // DD месяц
    ];

    return datePatterns.some(pattern => pattern.test(value.trim())) || !isNaN(Date.parse(value));
  }

  /**
   * Предложение маппинга на основе анализа
   */
  private suggestMapping(header: string, values: string[], type: 'text' | 'number' | 'date' | 'unknown'): { 
    suggestedMapping: string | null; 
    confidence: number 
  } {
    const headerLower = header.toLowerCase();
    
    // Номер чертежа
    if (this.isDrawingNumberLike(headerLower, values)) {
      return { suggestedMapping: 'drawingNumber', confidence: 85 };
    }
    
    // Количество
    if (this.isQuantityLike(headerLower, values, type)) {
      return { suggestedMapping: 'quantity', confidence: 80 };
    }
    
    // Дедлайн/срок
    if (this.isDeadlineLike(headerLower, type)) {
      return { suggestedMapping: 'deadline', confidence: 85 };
    }
    
    // Приоритет
    if (this.isPriorityLike(headerLower, values)) {
      return { suggestedMapping: 'priority', confidence: 75 };
    }
    
    // Тип работы
    if (this.isWorkTypeLike(headerLower)) {
      return { suggestedMapping: 'workType', confidence: 70 };
    }
    
    // Операции
    if (this.isOperationLike(headerLower, values)) {
      return { suggestedMapping: 'operations', confidence: 60 };
    }

    return { suggestedMapping: null, confidence: 0 };
  }

  /**
   * Импорт данных с пользовательским маппингом
   */
  async importWithMapping(file: MulterFile, settings: ExcelImportSettings): Promise<any[]> {
    console.log('📊 ИМПОРТ С ПОЛЬЗОВАТЕЛЬСКИМ МАППИНГОМ:', {
      fileName: file.originalname,
      settings: JSON.stringify(settings)
    });

    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.worksheets[settings.sheetIndex];
    if (!worksheet) {
      throw new BadRequestException(`Лист с индексом ${settings.sheetIndex} не найден`);
    }

    const orders: any[] = [];
    const startRow = settings.startRow || (settings.hasHeaders ? 2 : 1);

    for (let rowIndex = startRow; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      
      // Пропускаем пустые строки
      if (this.isEmptyRow(row)) continue;

      const order: any = {};

      // Маппим основные поля
      if (settings.columnMapping.drawingNumber) {
        order.drawingNumber = row.getCell(settings.columnMapping.drawingNumber).value?.toString()?.trim();
      }
      
      if (settings.columnMapping.quantity) {
        const qty = row.getCell(settings.columnMapping.quantity).value;
        order.quantity = typeof qty === 'number' ? qty : parseInt(qty?.toString() || '1', 10) || 1;
      }
      
      if (settings.columnMapping.deadline) {
        order.deadline = this.parseDate(row.getCell(settings.columnMapping.deadline).value);
      }
      
      if (settings.columnMapping.priority) {
        order.priority = this.parsePriority(row.getCell(settings.columnMapping.priority).value?.toString());
      }
      
      if (settings.columnMapping.workType) {
        order.workType = row.getCell(settings.columnMapping.workType).value?.toString()?.trim() || 'CNC';
      }

      // Операции (если настроены)
      if (settings.columnMapping.operations) {
        order.operations = this.parseOperationsFromMapping(row, settings.columnMapping.operations);
      } else {
        order.operations = [];
      }

      // Пропускаем заказы без номера чертежа
      if (order.drawingNumber) {
        orders.push(order);
      }
    }

    console.log(`✅ Импортировано ${orders.length} заказов с пользовательским маппингом`);
    return orders;
  }

  /**
   * Проверка пустой строки
   */
  private isEmptyRow(row: ExcelJS.Row): boolean {
    for (let colIndex = 1; colIndex <= row.cellCount; colIndex++) {
      const cellValue = row.getCell(colIndex).value;
      if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
        return false;
      }
    }
    return true;
  }

  private parseOperationsFromMapping(row: ExcelJS.Row, opsConfig: any): any[] {
    const operations: any[] = [];
    const { startColumn, columnsPerOperation, maxOperations } = opsConfig;

    for (let opIndex = 0; opIndex < (maxOperations || 10); opIndex++) {
      const baseCol = startColumn + (opIndex * columnsPerOperation);
      
      // Номер операции
      const opNumber = parseInt(row.getCell(baseCol).value?.toString() || '0', 10);
      if (!opNumber) break; // Если нет номера операции, останавливаемся

      // Тип операции (следующая колонка)
      const opTypeValue = row.getCell(baseCol + 1).value?.toString();
      const opType = this.parseOperationType(opTypeValue);

      // Время (если есть)
      const timeValue = columnsPerOperation > 2 ? 
        parseInt(row.getCell(baseCol + 2).value?.toString() || '60', 10) : 60;

      // Оси (если есть)
      const axesValue = columnsPerOperation > 3 ? 
        parseInt(row.getCell(baseCol + 3).value?.toString() || '3', 10) : 3;

      operations.push({
        operationNumber: opNumber,
        operationType: opType,
        estimatedTime: isNaN(timeValue) ? 60 : timeValue,
        machineAxes: isNaN(axesValue) ? 3 : axesValue
      });
    }

    return operations;
  }

  private isDrawingNumberLike(header: string, values: string[]): boolean {
    const keywords = ['номер', 'чертеж', 'drawing', 'number', 'код', 'артикул'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    // Проверяем формат значений (обычно содержат буквы и цифры)
    const hasAlphaNum = values.some(v => /[a-zA-Zа-яА-Я]/.test(v) && /\d/.test(v));
    
    return hasKeyword || hasAlphaNum;
  }

  private isDeadlineLike(header: string, type: string): boolean {
    const keywords = ['срок', 'дата', 'deadline', 'date', 'готовность'];
    return keywords.some(kw => header.includes(kw)) || type === 'date';
  }

  private isPriorityLike(header: string, values: string[]): boolean {
    const keywords = ['приоритет', 'priority', 'важность'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    const priorityValues = values.some(v => 
      ['critical', 'high', 'medium', 'low', 'критичный', 'высокий', 'средний', 'низкий'].includes(v.toLowerCase())
    );
    
    return hasKeyword || priorityValues;
  }

  private isWorkTypeLike(header: string): boolean {
    const keywords = ['тип', 'type', 'работа', 'work', 'операция'];
    return keywords.some(kw => header.includes(kw));
  }

  private isOperationLike(header: string, values: string[]): boolean {
    const keywords = ['операция', 'operation', 'оп', 'op'];
    return keywords.some(kw => header.includes(kw));
  }

  private numberToLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  private isQuantityLike(header: string, values: string[], type: 'text' | 'number' | 'date' | 'unknown'): boolean {
    const keywords = ['количество', 'кол-во', 'qty', 'quantity', 'шт'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    return hasKeyword && type === 'number';
  }

  /**
   * Парсинг даты
   */
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
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // По умолчанию - через месяц
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    return defaultDate;
  }

  /**
   * Парсинг приоритета
   */
  private parsePriority(value?: string): string {
    const priorityMap: Record<string, string> = {
      '1': 'CRITICAL',
      'критический': 'CRITICAL',
      'критичный': 'CRITICAL',
      'critical': 'CRITICAL',
      '2': 'HIGH',
      'высокий': 'HIGH',
      'high': 'HIGH',
      '3': 'MEDIUM',
      'средний': 'MEDIUM',
      'medium': 'MEDIUM',
      '4': 'LOW',
      'низкий': 'LOW',
      'low': 'LOW'
    };

    const priority = priorityMap[value?.toLowerCase() || ''];
    return priority || 'MEDIUM';
  }

  /**
   * Парсинг типа операции
   */
  private parseOperationType(value?: string): string {
    const typeMap: Record<string, string> = {
      'фрезерная': 'MILLING',
      'фрез': 'MILLING',
      'milling': 'MILLING',
      'ф': 'MILLING',
      'токарная': 'TURNING',
      'токар': 'TURNING',
      'turning': 'TURNING',
      'т': 'TURNING',
      'сверление': 'DRILLING',
      'сверл': 'DRILLING',
      'drilling': 'DRILLING',
      'с': 'DRILLING'
    };

    const type = typeMap[value?.toLowerCase() || ''];
    return type || 'MILLING';
  }
}
