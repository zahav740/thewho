/**
 * @file: excel-column-mapper.service.ts
 * @description: Сервис для анализа колонок Excel и настройки маппинга
 * @dependencies: exceljs
 * @created: 2025-06-25
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Express } from 'express';

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
  async analyzeExcelStructure(file: Express.Multer.File): Promise<ExcelFileAnalysis> {
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

  private isDrawingNumberLike(header: string, values: string[]): boolean {
    const keywords = ['номер', 'чертеж', 'drawing', 'number', 'код', 'артикул'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    // Проверяем формат значений (обычно содержат буквы и цифры)
    const hasAlphaNum = values.some(v => /[a-zA-Zа-яА-Я]/.test(v) && /\d/.test(v));
    
    return hasKeyword || hasAlphaNum;
  }

  private isQuantityLike(header: string, values: string[], type: 'text' | 'number' | 'date' | 'unknown'): boolean {
    const keywords = ['количество', 'кол-во', 'qty', 'quantity', 'шт'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    // Должно быть числовым типом и разумными значениями
    const isReasonableQty = type === 'number' && values.every(v => {
      const num = Number(v);
      return !isNaN(num) && num > 0 && num < 10000;
    });
    
    return hasKeyword || isReasonableQty;
  }

  private isDeadlineLike(header: string, type: 'text' | 'number' | 'date' | 'unknown'): boolean {
    const keywords = ['срок', 'дедлайн', 'deadline', 'дата', 'date', 'до'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    return hasKeyword || type === 'date';
  }

  private isPriorityLike(header: string, values: string[]): boolean {
    const keywords = ['приоритет', 'priority', 'важность'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    const hasPriorityValues = values.some(v => 
      ['высокий', 'низкий', 'средний', 'критический', 'high', 'low', 'medium', 'critical'].includes(v.toLowerCase())
    );
    
    return hasKeyword || hasPriorityValues;
  }

  private isWorkTypeLike(header: string): boolean {
    const keywords = ['тип', 'работа', 'type', 'work', 'описание', 'description'];
    return keywords.some(kw => header.includes(kw));
  }

  private isOperationLike(header: string, values: string[]): boolean {
    const keywords = ['операция', 'operation', 'фрез', 'токар', 'сверл', 'milling', 'turning'];
    const hasKeyword = keywords.some(kw => header.includes(kw));
    
    const hasOperationValues = values.some(v => 
      ['фрезерная', 'токарная', 'сверление', 'milling', 'turning', 'drilling'].includes(v.toLowerCase())
    );
    
    return hasKeyword || hasOperationValues;
  }

  /**
   * Преобразование номера колонки в букву
   */
  private numberToLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * Импорт данных с пользовательским маппингом
   */
  async importWithMapping(
    file: Express.Multer.File, 
    settings: ExcelImportSettings
  ): Promise<any[]> {
    console.log('📥 ИМПОРТ С МАППИНГОМ:', settings);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(settings.sheetIndex + 1); // ExcelJS использует 1-based индексы
    if (!worksheet) {
      throw new BadRequestException('Выбранный лист не найден');
    }

    const startRow = settings.startRow || (settings.hasHeaders ? 2 : 1);
    const orders = [];

    for (let rowIndex = startRow; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      
      // Пропускаем пустые строки
      if (this.isEmptyRow(row)) continue;

      try {
        const order = this.mapRowToOrder(row, settings.columnMapping);
        if (order) {
          orders.push(order);
        }
      } catch (error) {
        console.warn(`Ошибка в строке ${rowIndex}:`, error.message);
      }
    }

    console.log(`✅ Импортировано ${orders.length} заказов с пользовательским маппингом`);
    return orders;
  }

  /**
   * Проверка на пустую строку
   */
  private isEmptyRow(row: ExcelJS.Row): boolean {
    for (let i = 1; i <= Math.min(10, row.cellCount); i++) {
      const cellValue = row.getCell(i).value;
      if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
        return false;
      }
    }
    return true;
  }

  /**
   * Маппинг строки в объект заказа согласно настройкам
   */
  private mapRowToOrder(row: ExcelJS.Row, mapping: ColumnMapping): any | null {
    const order: any = {};

    // Номер чертежа (обязательное поле)
    if (mapping.drawingNumber) {
      const drawingNumber = row.getCell(mapping.drawingNumber).value?.toString()?.trim();
      if (!drawingNumber) return null;
      order.drawingNumber = drawingNumber;
    } else {
      return null; // Без номера чертежа не создаем заказ
    }

    // Количество
    if (mapping.quantity) {
      const quantity = parseInt(row.getCell(mapping.quantity).value?.toString() || '1', 10);
      order.quantity = isNaN(quantity) ? 1 : quantity;
    } else {
      order.quantity = 1;
    }

    // Срок
    if (mapping.deadline) {
      const deadlineValue = row.getCell(mapping.deadline).value;
      order.deadline = this.parseDate(deadlineValue);
    } else {
      // Дедлайн через месяц по умолчанию
      const defaultDeadline = new Date();
      defaultDeadline.setMonth(defaultDeadline.getMonth() + 1);
      order.deadline = defaultDeadline;
    }

    // Приоритет
    if (mapping.priority) {
      const priorityValue = row.getCell(mapping.priority).value?.toString();
      order.priority = this.parsePriority(priorityValue);
    } else {
      order.priority = 'MEDIUM';
    }

    // Тип работы
    if (mapping.workType) {
      const workType = row.getCell(mapping.workType).value?.toString()?.trim();
      order.workType = workType || 'Не указан';
    } else {
      order.workType = 'Не указан';
    }

    // Операции
    order.operations = [];
    if (mapping.operations) {
      const operations = this.parseOperationsFromRow(row, mapping.operations);
      order.operations = operations;
    }

    // Если операций нет, добавляем стандартную
    if (order.operations.length === 0) {
      order.operations.push({
        operationNumber: 1,
        operationType: 'MILLING',
        estimatedTime: 60,
        machineAxes: 3
      });
    }

    return order;
  }

  /**
   * Парсинг операций из строки
   */
  private parseOperationsFromRow(row: ExcelJS.Row, operationsConfig: ColumnMapping['operations']): any[] {
    const operations = [];
    const { startColumn, columnsPerOperation, maxOperations } = operationsConfig;

    for (let opIndex = 0; opIndex < maxOperations; opIndex++) {
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
