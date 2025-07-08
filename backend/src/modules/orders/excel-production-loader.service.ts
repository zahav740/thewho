/**
 * @file: excel-production-loader.service.ts
 * @description: Сервис для загрузки и обработки Excel файлов с производственными планами (תוכנית יצור)
 * @dependencies: exceljs, CreateOrderDto
 * @created: 2025-01-28
 * @updated: 2025-01-28 - Переписан для использования exceljs вместо xlsx
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Результат парсинга даты
 */
interface ParsedDate {
  date: Date | null;
  isValid: boolean;
  originalValue: any;
}

/**
 * Информация о строке Excel
 */
interface ExcelRowInfo {
  rowNumber: number;
  drawing: string;
  quantity: number;
  deadline: Date | null;
  priority: number;
  sourceData: any;
}

/**
 * Результат загрузки Excel файла
 */
export interface ExcelProductionLoadResult {
  success: boolean;
  data: CreateOrderDto[];
  statistics: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    withDeadlines: number;
    withoutDeadlines: number;
    byPriority: Record<number, number>;
    totalQuantity: number;
  };
  errors: Array<{
    row: number;
    drawing?: string;
    error: string;
    data?: any;
  }>;
  fileInfo: {
    filename: string;
    size: number;
    sheetName: string;
    dataRange: string;
  };
}

@Injectable()
export class ExcelProductionLoaderService {
  private readonly logger = new Logger(ExcelProductionLoaderService.name);
  
  // Конфигурация для листа "תוכנית יצור"
  private readonly TARGET_SHEET_NAME = 'תוכנית יצור';
  private readonly COLUMNS = {
    drawing: 3,      // C - מקט - номер чертежа (1-based, так что C = 3)
    quantity: 5,     // E - כמות - количество 
    deadline: 7,     // G - ת.אספקה - срок поставки
    priority: 11     // K - דחיפויות - приоритет
  };

  /**
   * Загружает и обрабатывает Excel файл с производственным планом
   * @param file - файл Excel
   * @returns результат загрузки с данными заказов
   */
  async loadProductionPlan(file: Express.Multer.File): Promise<ExcelProductionLoadResult> {
    this.logger.log(`Starting to load production plan from: ${file.originalname}`);
    
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл отсутствует или некорректен');
      }

      // Читаем Excel файл с помощью ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      // Проверяем наличие нужного листа
      let worksheet: ExcelJS.Worksheet | undefined;
      workbook.eachSheet((sheet) => {
        if (sheet.name === this.TARGET_SHEET_NAME) {
          worksheet = sheet;
        }
      });

      if (!worksheet) {
        const availableSheets = workbook.worksheets.map(ws => ws.name);
        throw new BadRequestException(
          `Лист "${this.TARGET_SHEET_NAME}" не найден. Доступные листы: ${availableSheets.join(', ')}`
        );
      }

      this.logger.log(`Processing sheet "${this.TARGET_SHEET_NAME}" with ${worksheet.rowCount} rows and ${worksheet.columnCount} columns`);

      const result: ExcelProductionLoadResult = {
        success: true,
        data: [],
        statistics: {
          totalRows: worksheet.rowCount,
          processedRows: 0,
          skippedRows: 0,
          withDeadlines: 0,
          withoutDeadlines: 0,
          byPriority: {},
          totalQuantity: 0
        },
        errors: [],
        fileInfo: {
          filename: file.originalname,
          size: file.size,
          sheetName: this.TARGET_SHEET_NAME,
          dataRange: `1:${worksheet.rowCount}x1:${worksheet.columnCount}`
        }
      };

      // Обрабатываем каждую строку (пропускаем заголовки - строка 1)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        try {
          const row = worksheet.getRow(rowNumber);
          const rowInfo = this.parseExcelRow(row, rowNumber);
          
          if (!rowInfo) {
            result.statistics.skippedRows++;
            continue;
          }

          // Создаем DTO для заказа
          const orderDto = this.createOrderDto(rowInfo);
          result.data.push(orderDto);
          
          // Обновляем статистику
          this.updateStatistics(result.statistics, rowInfo);
          result.statistics.processedRows++;

        } catch (error) {
          this.logger.warn(`Error processing row ${rowNumber}: ${error.message}`);
          result.errors.push({
            row: rowNumber,
            error: error.message,
            data: this.getRowData(worksheet.getRow(rowNumber))
          });
          result.statistics.skippedRows++;
        }
      }

      this.logger.log(`Excel processing completed: ${result.statistics.processedRows} processed, ${result.statistics.skippedRows} skipped, ${result.errors.length} errors`);
      
      return result;

    } catch (error) {
      this.logger.error(`Error loading production plan: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка обработки файла производственного плана: ${error.message}`);
    }
  }

  /**
   * Парсит строку Excel и извлекает данные
   * @param row - строка Excel
   * @param rowNumber - номер строки
   * @returns информация о строке или null если строка пустая
   */
  private parseExcelRow(row: ExcelJS.Row, rowNumber: number): ExcelRowInfo | null {
    const drawing = row.getCell(this.COLUMNS.drawing).value;
    
    // Пропускаем строки без номера чертежа
    if (!drawing || drawing.toString().trim() === '') {
      return null;
    }

    const quantity = row.getCell(this.COLUMNS.quantity).value;
    const deadline = row.getCell(this.COLUMNS.deadline).value;
    const priority = row.getCell(this.COLUMNS.priority).value;

    return {
      rowNumber,
      drawing: drawing.toString().trim(),
      quantity: this.validateQuantity(quantity),
      deadline: this.parseDate(deadline).date,
      priority: this.validatePriority(priority),
      sourceData: {
        drawing,
        quantity,
        deadline,
        priority
      }
    };
  }

  /**
   * Парсит дату из различных форматов
   * @param dateValue - значение даты из Excel
   * @returns результат парсинга даты
   */
  private parseDate(dateValue: any): ParsedDate {
    if (!dateValue) {
      return { date: null, isValid: false, originalValue: dateValue };
    }

    // Если уже объект Date
    if (dateValue instanceof Date) {
      return { date: dateValue, isValid: true, originalValue: dateValue };
    }

    // ExcelJS может вернуть объект с формулой или значением
    let actualValue = dateValue;
    if (typeof dateValue === 'object' && dateValue.formula) {
      actualValue = dateValue.result;
    }

    // Если строка в формате DD/M/YY или DD/MM/YY
    if (typeof actualValue === 'string') {
      const dateStr = actualValue.trim();
      
      // Пробуем формат DD/M/YY или DD/MM/YY
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (match) {
        const [, day, month, year] = match;
        
        // Преобразуем двузначный год в четырехзначный
        let fullYear = parseInt(year);
        if (fullYear < 100) {
          fullYear += 2000; // Предполагаем 20xx год
        }
        
        // Создаем дату (месяц в JS начинается с 0)
        const parsedDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        
        // Проверяем валидность даты
        if (!isNaN(parsedDate.getTime())) {
          return { date: parsedDate, isValid: true, originalValue: dateValue };
        }
      }
      
      // Пробуем стандартный Date.parse
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return { date: parsed, isValid: true, originalValue: dateValue };
      }
    }

    // Если число (Excel serial date)
    if (typeof actualValue === 'number') {
      // Excel начинает отсчет с 1 января 1900 года
      const excelEpoch = new Date(1900, 0, 1);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const parsedDate = new Date(excelEpoch.getTime() + (actualValue - 1) * millisecondsPerDay);
      
      if (!isNaN(parsedDate.getTime())) {
        return { date: parsedDate, isValid: true, originalValue: dateValue };
      }
    }

    this.logger.warn(`Could not parse date: ${JSON.stringify(dateValue)}`);
    return { date: null, isValid: false, originalValue: dateValue };
  }

  /**
   * Валидирует и нормализует приоритет
   * @param priorityValue - значение приоритета из Excel
   * @returns приоритет от 1 до 5, по умолчанию 4
   */
  private validatePriority(priorityValue: any): number {
    if (priorityValue === null || priorityValue === undefined) {
      return 4; // Значение по умолчанию
    }

    // Извлекаем актуальное значение если это объект с формулой
    let actualValue = priorityValue;
    if (typeof priorityValue === 'object' && priorityValue.formula) {
      actualValue = priorityValue.result;
    }

    const priority = parseInt(actualValue);
    
    // Проверяем, что приоритет в допустимом диапазоне
    if (isNaN(priority) || priority < 1 || priority > 5) {
      this.logger.warn(`Invalid priority: ${JSON.stringify(priorityValue)}, using default 4`);
      return 4;
    }

    return priority;
  }

  /**
   * Валидирует количество
   * @param quantityValue - значение количества из Excel
   * @returns количество, по умолчанию 1
   */
  private validateQuantity(quantityValue: any): number {
    if (quantityValue === null || quantityValue === undefined) {
      return 1; // Значение по умолчанию
    }

    // Извлекаем актуальное значение если это объект с формулой
    let actualValue = quantityValue;
    if (typeof quantityValue === 'object' && quantityValue.formula) {
      actualValue = quantityValue.result;
    }

    const quantity = parseInt(actualValue);
    
    if (isNaN(quantity) || quantity < 0) {
      this.logger.warn(`Invalid quantity: ${JSON.stringify(quantityValue)}, using default 1`);
      return 1;
    }

    return quantity;
  }

  /**
   * Создает DTO заказа из информации о строке
   * @param rowInfo - информация о строке Excel
   * @returns DTO для создания заказа
   */
  private createOrderDto(rowInfo: ExcelRowInfo): CreateOrderDto {
    return {
      drawingNumber: rowInfo.drawing,
      quantity: rowInfo.quantity,
      deadline: rowInfo.deadline ? rowInfo.deadline.toISOString() : undefined,
      priority: rowInfo.priority,
      workType: 'production', // Тип работы по умолчанию для производственного плана
      operations: [] // Операции будут добавлены позже
    };
  }

  /**
   * Обновляет статистику обработки
   * @param statistics - объект статистики
   * @param rowInfo - информация о строке
   */
  private updateStatistics(statistics: any, rowInfo: ExcelRowInfo): void {
    // Статистика по датам
    if (rowInfo.deadline) {
      statistics.withDeadlines++;
    } else {
      statistics.withoutDeadlines++;
    }

    // Статистика по приоритетам
    statistics.byPriority[rowInfo.priority] = (statistics.byPriority[rowInfo.priority] || 0) + 1;

    // Общее количество
    statistics.totalQuantity += rowInfo.quantity;
  }

  /**
   * Получает данные строки для отладки
   * @param row - строка Excel
   * @returns данные строки
   */
  private getRowData(row: ExcelJS.Row): any {
    return {
      drawing: row.getCell(this.COLUMNS.drawing).value,
      quantity: row.getCell(this.COLUMNS.quantity).value,
      deadline: row.getCell(this.COLUMNS.deadline).value,
      priority: row.getCell(this.COLUMNS.priority).value
    };
  }

  /**
   * Фильтрует данные по приоритету
   * @param data - массив заказов
   * @param priorities - приоритет(ы) для фильтрации
   * @returns отфильтрованный массив
   */
  filterByPriority(data: CreateOrderDto[], priorities: number | number[]): CreateOrderDto[] {
    const priorityArray = Array.isArray(priorities) ? priorities : [priorities];
    return data.filter(item => priorityArray.includes(item.priority));
  }

  /**
   * Сортирует данные по приоритету и дате
   * @param data - массив заказов
   * @returns отсортированный массив
   */
  sortByPriorityAndDate(data: CreateOrderDto[]): CreateOrderDto[] {
    return data.sort((a, b) => {
      // Сначала по приоритету (1 - высший, 5 - низший)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Затем по дате (более ранние даты первыми)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      
      // Если у одного нет даты, он идет в конец
      if (!a.deadline && b.deadline) return 1;
      if (a.deadline && !b.deadline) return -1;
      
      return 0;
    });
  }

  /**
   * Проверяет, является ли файл файлом производственного плана
   * @param file - файл для проверки
   * @returns true если это файл производственного плана
   */
  async validateProductionPlanFile(file: Express.Multer.File): Promise<boolean> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      
      let hasTargetSheet = false;
      workbook.eachSheet((sheet) => {
        if (sheet.name === this.TARGET_SHEET_NAME) {
          hasTargetSheet = true;
        }
      });
      
      return hasTargetSheet;
    } catch (error) {
      this.logger.error(`Error validating production plan file: ${error.message}`);
      return false;
    }
  }

  /**
   * Получает список доступных листов в файле
   * @param file - файл Excel
   * @returns список названий листов
   */
  async getSheetNames(file: Express.Multer.File): Promise<string[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      
      const sheetNames: string[] = [];
      workbook.eachSheet((sheet) => {
        sheetNames.push(sheet.name);
      });
      
      return sheetNames;
    } catch (error) {
      this.logger.error(`Error getting sheet names: ${error.message}`);
      throw new BadRequestException('Не удалось прочитать файл Excel');
    }
  }
}
