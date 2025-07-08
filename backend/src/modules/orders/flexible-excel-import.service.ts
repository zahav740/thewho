/**
 * @file: flexible-excel-import.service.ts
 * @description: Упрощенный сервис для гибкого импорта Excel с пользовательским маппингом колонок
 * @dependencies: exceljs, CreateOrderDto
 * @created: 2025-01-28
 * @updated: 2025-01-28 - Упрощенная версия с гибким маппингом
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Маппинг колонок пользователя
 */
export interface ColumnMapping {
  [columnLetter: string]: string; // например: { 'A': 'drawingNumber', 'B': 'quantity' }
}

/**
 * Настройки импорта
 */
export interface FlexibleImportSettings {
  columnMapping: ColumnMapping;
  sheetName?: string;
  startRow?: number; // С какой строки начинать (по умолчанию 2, пропуская заголовки)
  updateExisting?: boolean;
  excludeGreenRows?: boolean; // 🆕 Исключить строки с зеленым фоном
  colorFilters?: {
    excludeColors?: string[]; // 🆕 Массив цветов для исключения (hex коды)
    includeColors?: string[]; // 🆕 Массив цветов для включения (hex коды)
  };
}

/**
 * Результат анализа Excel файла
 */
export interface ExcelAnalysisResult {
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
  }>;
  columns: Array<{
    letter: string;
    index: number;
    header: string;
    sampleData: any[];
  }>;
  selectedSheet: {
    name: string;
    range: string;
  };
}

/**
 * Результат импорта
 */
export interface FlexibleImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    field?: string;
    value?: any;
    error: string;
  }>;
  statistics: {
    totalProcessed: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
  };
  preview?: CreateOrderDto[];
}

@Injectable()
export class FlexibleExcelImportService {
  private readonly logger = new Logger(FlexibleExcelImportService.name);

  /**
   * Анализирует структуру Excel файла
   * @param file - файл Excel
   * @param sheetName - название листа (опционально, по умолчанию первый лист)
   * @returns структура файла с колонками и данными
   */
  async analyzeExcelStructure(file: Express.Multer.File, sheetName?: string): Promise<ExcelAnalysisResult> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл отсутствует или некорректен');
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      // Получаем информацию о всех листах
      const sheets = workbook.worksheets.map(sheet => ({
        name: sheet.name,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount
      }));

      // Выбираем лист для анализа
      let targetSheet: ExcelJS.Worksheet;
      if (sheetName) {
        targetSheet = workbook.getWorksheet(sheetName);
        if (!targetSheet) {
          throw new BadRequestException(`Лист "${sheetName}" не найден`);
        }
      } else {
        targetSheet = workbook.worksheets[0];
      }

      // Анализируем колонки
      const columns = [];
      const headerRow = targetSheet.getRow(1);
      
      for (let col = 1; col <= targetSheet.columnCount; col++) {
        const columnLetter = this.numberToLetter(col);
        const headerCell = headerRow.getCell(col);
        const headerValue = headerCell.value || `Колонка ${columnLetter}`;

        // Получаем образцы данных (первые 3 не пустые значения)
        const sampleData = [];
        for (let row = 2; row <= Math.min(targetSheet.rowCount, 10); row++) {
          const cell = targetSheet.getCell(row, col);
          if (cell.value && sampleData.length < 3) {
            sampleData.push(cell.value);
          }
        }

        columns.push({
          letter: columnLetter,
          index: col - 1,
          header: headerValue.toString(),
          sampleData
        });
      }

      this.logger.log(`Analyzed Excel structure: ${sheets.length} sheets, ${columns.length} columns`);

      return {
        sheets,
        columns,
        selectedSheet: {
          name: targetSheet.name,
          range: `A1:${this.numberToLetter(targetSheet.columnCount)}${targetSheet.rowCount}`
        }
      };

    } catch (error) {
      this.logger.error(`Error analyzing Excel structure: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка анализа Excel файла: ${error.message}`);
    }
  }

  /**
   * Предварительный просмотр данных с пользовательским маппингом
   * @param file - файл Excel
   * @param settings - настройки импорта с маппингом колонок
   * @param limit - количество строк для предварительного просмотра
   * @returns предварительный просмотр данных
   */
  async previewWithMapping(
    file: Express.Multer.File,
    settings: FlexibleImportSettings,
    limit: number = 10
  ): Promise<FlexibleImportResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      const sheetName = settings.sheetName || workbook.worksheets[0].name;
      const worksheet = workbook.getWorksheet(sheetName);
      
      if (!worksheet) {
        throw new BadRequestException(`Лист "${sheetName}" не найден`);
      }

      const startRow = settings.startRow || 2; // Пропускаем заголовки
      const result: FlexibleImportResult = {
        success: true,
        created: 0,
        updated: 0,
        errors: [],
        statistics: {
          totalProcessed: 0,
          validRows: 0,
          invalidRows: 0,
          duplicates: 0
        },
        preview: []
      };

      // Обрабатываем строки для предварительного просмотра
      for (let rowNumber = startRow; rowNumber <= Math.min(startRow + limit - 1, worksheet.rowCount); rowNumber++) {
        try {
          const orderDto = this.parseRowWithMapping(worksheet, rowNumber, settings.columnMapping, settings);
          
          if (orderDto) {
            result.preview.push(orderDto);
            result.statistics.validRows++;
          } else {
            result.statistics.invalidRows++;
          }
          
          result.statistics.totalProcessed++;
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error.message
          });
          result.statistics.invalidRows++;
        }
      }

      this.logger.log(`Preview completed: ${result.statistics.validRows} valid rows, ${result.errors.length} errors`);
      return result;

    } catch (error) {
      this.logger.error(`Error in preview: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка предварительного просмотра: ${error.message}`);
    }
  }

  /**
   * Импорт данных с пользовательским маппингом
   * @param file - файл Excel
   * @param settings - настройки импорта
   * @returns результат импорта
   */
  async importWithMapping(
    file: Express.Multer.File,
    settings: FlexibleImportSettings
  ): Promise<CreateOrderDto[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      const sheetName = settings.sheetName || workbook.worksheets[0].name;
      const worksheet = workbook.getWorksheet(sheetName);
      
      if (!worksheet) {
        throw new BadRequestException(`Лист "${sheetName}" не найден`);
      }

      const startRow = settings.startRow || 2;
      const orders: CreateOrderDto[] = [];

      this.logger.log(`Starting import from sheet "${sheetName}", starting row ${startRow}`);

      // Обрабатываем все строки
      for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber++) {
        try {
          const orderDto = this.parseRowWithMapping(worksheet, rowNumber, settings.columnMapping, settings);
          
          if (orderDto) {
            orders.push(orderDto);
          }
        } catch (error) {
          this.logger.warn(`Error parsing row ${rowNumber}: ${error.message}`);
          // Продолжаем обработку других строк
        }
      }

      this.logger.log(`Import parsing completed: ${orders.length} orders extracted`);
      return orders;

    } catch (error) {
      this.logger.error(`Error in import: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка импорта: ${error.message}`);
    }
  }

  /**
   * Парсит строку Excel согласно пользовательскому маппингу
   * @param worksheet - рабочий лист
   * @param rowNumber - номер строки
   * @param columnMapping - маппинг колонок
   * @param settings - настройки импорта (для цветовых фильтров)
   * @returns DTO заказа или null если строка пустая или фильтруется
   */
  private parseRowWithMapping(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
    columnMapping: ColumnMapping,
    settings?: FlexibleImportSettings
  ): CreateOrderDto | null {
    const row = worksheet.getRow(rowNumber);
    
    // 🆕 Проверяем цветовые фильтры
    if (settings && !this.shouldIncludeRow(row, settings)) {
      return null;
    }

    const orderData: any = {};

    // Извлекаем данные согласно маппингу
    Object.entries(columnMapping).forEach(([columnLetter, fieldName]) => {
      const columnIndex = this.letterToNumber(columnLetter);
      const cell = row.getCell(columnIndex);
      
      if (cell && cell.value !== null && cell.value !== undefined) {
        orderData[fieldName] = this.processCellValue(cell.value, fieldName);
      }
    });

    // Проверяем, есть ли хотя бы номер чертежа
    if (!orderData.drawingNumber || orderData.drawingNumber.toString().trim() === '') {
      return null;
    }

    // Создаем валидный DTO
    const orderDto: CreateOrderDto = {
      drawingNumber: orderData.drawingNumber.toString().trim(),
      quantity: this.validateQuantity(orderData.quantity),
      deadline: this.validateDate(orderData.deadline),
      priority: this.validatePriority(orderData.priority),
      workType: orderData.workType?.toString() || 'production',
      operations: []
    };

    return orderDto;
  }

  /**
   * 🆕 Проверяет, следует ли включить строку на основе цветовых фильтров
   * @param row - строка Excel
   * @param settings - настройки импорта
   * @returns true если строку нужно включить
   */
  private shouldIncludeRow(row: ExcelJS.Row, settings: FlexibleImportSettings): boolean {
    // Проверяем фильтр на зеленые строки
    if (settings.excludeGreenRows) {
      if (this.isRowGreen(row)) {
        return false; // Исключаем зеленые строки
      }
    }

    // Проверяем общие цветовые фильтры
    if (settings.colorFilters) {
      const rowColors = this.getRowColors(row);
      
      // Проверяем исключаемые цвета
      if (settings.colorFilters.excludeColors && settings.colorFilters.excludeColors.length > 0) {
        const hasExcludedColor = rowColors.some(color => 
          settings.colorFilters.excludeColors.includes(color)
        );
        if (hasExcludedColor) {
          return false;
        }
      }

      // Проверяем включаемые цвета (если указаны)
      if (settings.colorFilters.includeColors && settings.colorFilters.includeColors.length > 0) {
        const hasIncludedColor = rowColors.some(color => 
          settings.colorFilters.includeColors.includes(color)
        );
        if (!hasIncludedColor) {
          return false;
        }
      }
    }

    return true; // Строка прошла все фильтры
  }

  /**
   * 🆕 Проверяет, является ли строка зеленой (любой оттенок зеленого)
   * @param row - строка Excel
   * @returns true если строка содержит зеленые ячейки
   */
  private isRowGreen(row: ExcelJS.Row): boolean {
    // Определяем зеленые цвета (hex коды)
    const greenColors = [
      '00FF00', // Ярко-зеленый
      '90EE90', // Светло-зеленый
      '98FB98', // Бледно-зеленый
      '00FF7F', // Весенний зеленый
      '32CD32', // Лаймовый зеленый
      '7CFC00', // Лайм
      '7FFF00', // Шартрез
      'ADFF2F', // Желто-зеленый
      '9AFF9A', // Светло-зеленый мята
      'C0FFC0', // Очень светло-зеленый
      'FF90EE90', // С альфа-каналом
      'FF98FB98', // С альфа-каналом
      'FF00FF00'  // С альфа-каналом
    ];

    // Проверяем каждую ячейку в строке
    for (let colIndex = 1; colIndex <= row.cellCount; colIndex++) {
      const cell = row.getCell(colIndex);
      const cellColor = this.getCellBackgroundColor(cell);
      
      if (cellColor && this.isGreenColor(cellColor, greenColors)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 🆕 Получает все цвета фона ячеек в строке
   * @param row - строка Excel
   * @returns массив hex кодов цветов
   */
  private getRowColors(row: ExcelJS.Row): string[] {
    const colors: string[] = [];
    
    for (let colIndex = 1; colIndex <= row.cellCount; colIndex++) {
      const cell = row.getCell(colIndex);
      const cellColor = this.getCellBackgroundColor(cell);
      
      if (cellColor && !colors.includes(cellColor)) {
        colors.push(cellColor);
      }
    }

    return colors;
  }

  /**
   * 🆕 Получает цвет фона ячейки
   * @param cell - ячейка Excel
   * @returns hex код цвета или null
   */
  private getCellBackgroundColor(cell: ExcelJS.Cell): string | null {
    try {
      const fill = cell.style?.fill;
      
      if (!fill || fill.type !== 'pattern') {
        return null;
      }

      const patternFill = fill as any;
      const fgColor = patternFill.fgColor;
      
      if (fgColor && fgColor.argb) {
        // Удаляем альфа-канал если он есть (8 символов -> 6)
        const colorCode = fgColor.argb.toString().toUpperCase();
        return colorCode.length === 8 ? colorCode.substring(2) : colorCode;
      }

      return null;
    } catch (error) {
      // Ошибка при получении цвета, возвращаем null
      return null;
    }
  }

  /**
   * 🆕 Проверяет, является ли цвет зеленым
   * @param color - hex код цвета
   * @param greenColors - массив зеленых цветов
   * @returns true если цвет зеленый
   */
  private isGreenColor(color: string, greenColors: string[]): boolean {
    const normalizedColor = color.toUpperCase();
    
    // Прямое соответствие
    if (greenColors.includes(normalizedColor)) {
      return true;
    }

    // Проверяем по RGB компонентам (зеленый канал доминирует)
    if (normalizedColor.length === 6) {
      const r = parseInt(normalizedColor.substring(0, 2), 16);
      const g = parseInt(normalizedColor.substring(2, 4), 16);
      const b = parseInt(normalizedColor.substring(4, 6), 16);
      
      // Зеленый канал должен быть доминирующим и достаточно ярким
      return g > 150 && g > r && g > b && (g - Math.max(r, b)) > 50;
    }

    return false;
  }

  /**
   * Обрабатывает значение ячейки в зависимости от типа поля
   * @param value - значение ячейки
   * @param fieldName - название поля
   * @returns обработанное значение
   */
  private processCellValue(value: any, fieldName: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Обработка формул Excel
    if (typeof value === 'object' && value.formula) {
      value = value.result;
    }

    switch (fieldName) {
      case 'deadline':
        return this.parseDateValue(value);
      case 'quantity':
      case 'priority':
        return parseInt(value) || null;
      default:
        return value;
    }
  }

  /**
   * Парсит дату из различных форматов
   * @param value - значение даты
   * @returns объект Date или null
   */
  private parseDateValue(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      // Формат DD/MM/YY или DD/M/YY
      const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (match) {
        const [, day, month, year] = match;
        let fullYear = parseInt(year);
        if (fullYear < 100) {
          fullYear += 2000;
        }
        return new Date(fullYear, parseInt(month) - 1, parseInt(day));
      }

      // Стандартный парсинг
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    if (typeof value === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1900, 0, 1);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      return new Date(excelEpoch.getTime() + (value - 1) * millisecondsPerDay);
    }

    return null;
  }

  /**
   * Валидирует количество
   * @param value - значение количества
   * @returns валидное количество
   */
  private validateQuantity(value: any): number {
    const quantity = parseInt(value);
    return isNaN(quantity) || quantity < 1 ? 1 : quantity;
  }

  /**
   * Валидирует дату
   * @param value - значение даты
   * @returns ISO строка даты или undefined
   */
  private validateDate(value: any): string | undefined {
    const date = this.parseDateValue(value);
    return date ? date.toISOString() : undefined;
  }

  /**
   * Валидирует приоритет
   * @param value - значение приоритета
   * @returns валидный приоритет
   */
  private validatePriority(value: any): number {
    const priority = parseInt(value);
    return isNaN(priority) || priority < 1 || priority > 5 ? 4 : priority;
  }

  /**
   * Преобразует номер колонки в букву (1 -> A, 2 -> B, ...)
   * @param num - номер колонки
   * @returns буква колонки
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
   * Преобразует букву колонки в номер (A -> 1, B -> 2, ...)
   * @param letter - буква колонки
   * @returns номер колонки
   */
  private letterToNumber(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result;
  }
}
