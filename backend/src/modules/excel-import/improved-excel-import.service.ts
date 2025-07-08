/**
 * @file: improved-excel-import.service.ts
 * @description: Переделанный сервис для загрузки Excel с дефолтными колонками
 * @created: 2025-07-03
 * @features: Дефолтные колонки C, E, G, K с возможностью настройки
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcelFile } from '../../database/entities/excel-file.entity';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import type { Express } from 'express';

// Дефолтное сопоставление колонок
export const DEFAULT_COLUMN_MAPPING = {
  drawingNumber: 'C',  // номер чертежа
  quantity: 'E',       // количество
  deadline: 'G',       // дедлайн
  priority: 'K'        // приоритет
} as const;

export interface ColumnMapping {
  drawingNumber: string;
  quantity: string;
  deadline: string;
  priority: string;
}

export interface ExcelUploadOptions {
  columnMapping?: Partial<ColumnMapping>;
  startRow?: number;
  maxRows?: number;
  sheetIndex?: number;
  skipEmptyRows?: boolean;
  uploadedBy?: string;
  description?: string;
}

export interface ProcessedExcelData {
  drawingNumber: string | null;
  quantity: number | null;
  deadline: string | Date | null;
  priority: string | number | null;
  rawData: Record<string, any>;
  rowIndex: number;
}

export interface ExcelUploadResult {
  id: number;
  originalName: string;
  fileSize: number;
  processedRows: number;
  totalRows: number;
  headers: string[];
  status: string;
  message: string;
  preview: ProcessedExcelData[];
  columnMapping: ColumnMapping;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ImprovedExcelImportService {
  private readonly logger = new Logger(ImprovedExcelImportService.name);

  constructor(
    @InjectRepository(ExcelFile)
    private readonly excelFileRepository: Repository<ExcelFile>,
  ) {}

  /**
   * Главный метод загрузки и обработки Excel файла
   */
  async uploadAndProcessExcel(
    file: Express.Multer.File,
    options: ExcelUploadOptions = {}
  ): Promise<ExcelUploadResult> {
    this.logger.log(`🚀 Начинаем обработку файла: ${file.originalname}`);

    try {
      // 1. Валидация файла
      await this.validateFile(file);

      // 2. Парсинг Excel
      const parseResult = await this.parseExcelFile(file.buffer, options);

      // 3. Обработка данных с дефолтными колонками
      const processedData = this.processDataWithMapping(parseResult, options);

      // 4. Сохранение в БД
      const savedFile = await this.saveFileToDatabase(file, processedData, options);

      this.logger.log(`✅ Файл успешно обработан: ${processedData.processedRows} строк`);

      return {
        id: savedFile.id,
        originalName: savedFile.originalName,
        fileSize: savedFile.fileSize,
        processedRows: processedData.processedRows,
        totalRows: processedData.totalRows,
        headers: processedData.headers,
        status: 'success',
        message: 'Файл успешно загружен и обработан',
        preview: processedData.data.slice(0, 5),
        columnMapping: processedData.columnMapping,
        errors: processedData.errors,
        warnings: processedData.warnings
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка обработки файла: ${error.message}`);
      throw error;
    }
  }

  /**
   * Валидация загружаемого файла
   */
  private async validateFile(file: Express.Multer.File): Promise<void> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Файл не предоставлен или пуст');
    }

    // Проверка размера (максимум 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('Размер файла превышает 50MB');
    }

    // Проверка типа файла
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];

    const hasValidType = allowedTypes.includes(file.mimetype) || 
                        /\.(xlsx?|csv)$/i.test(file.originalname);

    if (!hasValidType) {
      throw new BadRequestException('Поддерживаются только Excel файлы (.xlsx, .xls)');
    }

    // Проверка на корректность Excel файла
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      
      if (workbook.worksheets.length === 0) {
        throw new BadRequestException('Excel файл не содержит рабочих листов');
      }
    } catch (error) {
      throw new BadRequestException(`Файл поврежден или имеет неверный формат: ${error.message}`);
    }
  }

  /**
   * Парсинг Excel файла
   */
  private async parseExcelFile(
    buffer: Buffer,
    options: ExcelUploadOptions
  ): Promise<{
    workbook: ExcelJS.Workbook;
    worksheet: ExcelJS.Worksheet;
    headers: string[];
    totalRows: number;
  }> {
    const { sheetIndex = 0, startRow = 2 } = options;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(sheetIndex + 1);
    if (!worksheet) {
      throw new BadRequestException(`Лист с индексом ${sheetIndex} не найден`);
    }

    // Получаем заголовки из первой строки
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    
    // Читаем все колонки до последней заполненной
    for (let col = 1; col <= headerRow.cellCount; col++) {
      const cell = headerRow.getCell(col);
      const value = this.getCellValue(cell);
      headers.push(value ? String(value).trim() : `Колонка ${this.getColumnLetter(col)}`);
    }

    this.logger.log(`📊 Найдено ${headers.length} колонок, строк: ${worksheet.rowCount}`);

    return {
      workbook,
      worksheet,
      headers,
      totalRows: worksheet.rowCount - (startRow - 1)
    };
  }

  /**
   * Обработка данных с применением маппинга колонок
   */
  private processDataWithMapping(
    parseResult: any,
    options: ExcelUploadOptions
  ): {
    data: ProcessedExcelData[];
    processedRows: number;
    totalRows: number;
    headers: string[];
    columnMapping: ColumnMapping;
    errors: string[];
    warnings: string[];
  } {
    const { worksheet, headers, totalRows } = parseResult;
    const { 
      columnMapping: customMapping = {}, 
      startRow = 2, 
      maxRows = 10000,
      skipEmptyRows = true 
    } = options;

    // Создаем финальный маппинг (дефолтный + пользовательский)
    const finalMapping: ColumnMapping = {
      ...DEFAULT_COLUMN_MAPPING,
      ...customMapping
    };

    const data: ProcessedExcelData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    this.logger.log(`🔄 Применяем маппинг колонок: ${JSON.stringify(finalMapping)}`);

    // Проверяем наличие требуемых колонок
    this.validateColumnMapping(finalMapping, headers, warnings);

    const maxRowsToProcess = Math.min(worksheet.rowCount, startRow + maxRows - 1);
    let processedCount = 0;

    for (let rowNum = startRow; rowNum <= maxRowsToProcess; rowNum++) {
      try {
        const row = worksheet.getRow(rowNum);
        
        if (!row || row.cellCount === 0) {
          if (!skipEmptyRows) {
            data.push(this.createEmptyRow(rowNum));
            processedCount++;
          }
          continue;
        }

        const processedRow = this.processRow(row, finalMapping, headers, rowNum);
        
        // Проверяем, есть ли хоть какие-то данные в важных колонках
        const hasImportantData = processedRow.drawingNumber || 
                                processedRow.quantity || 
                                processedRow.deadline || 
                                processedRow.priority;

        if (hasImportantData || !skipEmptyRows) {
          data.push(processedRow);
          processedCount++;
        }

      } catch (error) {
        errors.push(`Ошибка в строке ${rowNum}: ${error.message}`);
        this.logger.warn(`⚠️ Ошибка обработки строки ${rowNum}: ${error.message}`);
      }
    }

    this.logger.log(`✅ Обработано ${processedCount} строк из ${totalRows}`);

    return {
      data,
      processedRows: processedCount,
      totalRows,
      headers,
      columnMapping: finalMapping,
      errors,
      warnings
    };
  }

  /**
   * Обработка одной строки данных
   */
  private processRow(
    row: ExcelJS.Row,
    mapping: ColumnMapping,
    headers: string[],
    rowIndex: number
  ): ProcessedExcelData {
    // Получаем все данные строки
    const rawData: Record<string, any> = {};
    for (let col = 1; col <= headers.length; col++) {
      const cell = row.getCell(col);
      const header = headers[col - 1];
      rawData[header] = this.getCellValue(cell);
    }

    // Извлекаем данные по маппингу
    const drawingNumber = this.getValueByColumnLetter(row, mapping.drawingNumber);
    const quantity = this.parseQuantity(this.getValueByColumnLetter(row, mapping.quantity));
    const deadline = this.parseDeadline(this.getValueByColumnLetter(row, mapping.deadline));
    const priority = this.parsePriority(this.getValueByColumnLetter(row, mapping.priority));

    return {
      drawingNumber: drawingNumber ? String(drawingNumber).trim() : null,
      quantity,
      deadline,
      priority,
      rawData,
      rowIndex
    };
  }

  /**
   * Получение значения ячейки по букве колонки (A, B, C, etc.)
   */
  private getValueByColumnLetter(row: ExcelJS.Row, columnLetter: string): any {
    const columnNumber = this.getColumnNumber(columnLetter);
    const cell = row.getCell(columnNumber);
    return this.getCellValue(cell);
  }

  /**
   * Извлечение значения из ячейки с обработкой разных типов
   */
  private getCellValue(cell: ExcelJS.Cell): any {
    if (!cell || cell.value === null || cell.value === undefined) {
      return null;
    }

    const value = cell.value;

    // Простые типы
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Даты
    if (value instanceof Date) {
      return value;
    }

    // Формулы
    if (typeof value === 'object' && 'result' in value) {
      return (value as any).result;
    }

    // Rich text
    if (typeof value === 'object' && 'richText' in value) {
      return (value as any).richText.map((rt: any) => rt.text || '').join('');
    }

    // Гиперссылки
    if (typeof value === 'object' && 'text' in value) {
      return (value as any).text;
    }

    return String(value);
  }

  /**
   * Парсинг количества
   */
  private parseQuantity(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.,\-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * Парсинг даты дедлайна
   */
  private parseDeadline(value: any): string | Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      // Попытка парсинга различных форматов дат
      const dateFormats = [
        /^\d{4}-\d{2}-\d{2}$/,        // YYYY-MM-DD
        /^\d{2}\.\d{2}\.\d{4}$/,      // DD.MM.YYYY
        /^\d{2}\/\d{2}\/\d{4}$/,      // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/,        // DD-MM-YYYY
      ];

      for (const format of dateFormats) {
        if (format.test(value)) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
      }

      // Если не удалось распарсить как дату, возвращаем как строку
      return value.trim();
    }

    return null;
  }

  /**
   * Парсинг приоритета
   */
  private parsePriority(value: any): string | number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Проверяем на числовой приоритет
      const numericPriority = parseInt(trimmed);
      if (!isNaN(numericPriority)) {
        return numericPriority;
      }

      // Возвращаем как строку
      return trimmed;
    }

    return null;
  }

  /**
   * Создание пустой строки
   */
  private createEmptyRow(rowIndex: number): ProcessedExcelData {
    return {
      drawingNumber: null,
      quantity: null,
      deadline: null,
      priority: null,
      rawData: {},
      rowIndex
    };
  }

  /**
   * Валидация маппинга колонок
   */
  private validateColumnMapping(
    mapping: ColumnMapping, 
    headers: string[], 
    warnings: string[]
  ): void {
    const maxColumn = headers.length;
    
    Object.entries(mapping).forEach(([field, columnLetter]) => {
      const columnNumber = this.getColumnNumber(columnLetter);
      if (columnNumber > maxColumn) {
        warnings.push(`Колонка ${columnLetter} для поля "${field}" не существует в файле`);
      }
    });
  }

  /**
   * Преобразование буквы колонки в номер (A=1, B=2, etc.)
   */
  private getColumnNumber(columnLetter: string): number {
    let result = 0;
    for (let i = 0; i < columnLetter.length; i++) {
      result = result * 26 + (columnLetter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  /**
   * Преобразование номера колонки в букву (1=A, 2=B, etc.)
   */
  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode('A'.charCodeAt(0) + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  /**
   * Сохранение файла в базу данных
   */
  private async saveFileToDatabase(
    file: Express.Multer.File,
    processedData: any,
    options: ExcelUploadOptions
  ): Promise<ExcelFile> {
    const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');

    // Проверяем дубликат
    const existingFile = await this.excelFileRepository.findOne({
      where: { fileHash }
    });

    if (existingFile) {
      this.logger.warn(`📄 Файл с таким содержимым уже существует: ${existingFile.originalName}`);
      return existingFile;
    }

    // Создаем новую запись
    const excelFile = new ExcelFile();
    excelFile.originalName = file.originalname;
    excelFile.description = options.description || null;
    excelFile.fileSize = file.size;
    excelFile.mimeType = file.mimetype;
    excelFile.fileHash = fileHash;
    excelFile.fileData = file.buffer;
    excelFile.uploadedBy = options.uploadedBy || 'system';
    excelFile.status = 'parsed';
    excelFile.headers = processedData.headers;
    excelFile.setParsedData(processedData.data);
    excelFile.sheetsCount = 1;
    excelFile.metadata = {
      columnMapping: processedData.columnMapping,
      uploadOptions: options,
      processedAt: new Date(),
      errors: processedData.errors,
      warnings: processedData.warnings
    };

    return await this.excelFileRepository.save(excelFile);
  }

  /**
   * Получение файла по ID
   */
  async getFile(id: number): Promise<ExcelFile> {
    const file = await this.excelFileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`Файл с ID ${id} не найден`);
    }
    return file;
  }

  /**
   * Получение списка файлов
   */
  async getFilesList(page = 1, limit = 20): Promise<{
    files: ExcelFile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [files, total] = await this.excelFileRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id', 'originalName', 'description', 'fileSize', 
        'rowsCount', 'status', 'uploadedBy', 'createdAt'
      ]
    });

    return {
      files,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Получение данных файла
   */
  async getFileData(id: number, offset = 0, limit = 100): Promise<{
    file: any;
    data: ProcessedExcelData[];
    total: number;
    hasMore: boolean;
  }> {
    const file = await this.getFile(id);
    const allData = file.getParsedDataAsJson();
    const data = allData.slice(offset, offset + limit);

    return {
      file: file.getFileInfo(),
      data,
      total: allData.length,
      hasMore: offset + limit < allData.length
    };
  }

  /**
   * Удаление файла
   */
  async deleteFile(id: number): Promise<void> {
    const file = await this.getFile(id);
    await this.excelFileRepository.remove(file);
    this.logger.log(`🗑️ Файл удален: ${file.originalName}`);
  }

  /**
   * Получение статистики
   */
  async getStatistics() {
    const queryBuilder = this.excelFileRepository.createQueryBuilder('excel');
    
    const [totalFiles, totalSize, totalRows] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.select('SUM(excel.fileSize)', 'sum').getRawOne().then(r => parseInt(r.sum || 0)),
      queryBuilder.select('SUM(excel.rowsCount)', 'sum').getRawOne().then(r => parseInt(r.sum || 0)),
    ]);

    return {
      totalFiles,
      totalSize,
      totalRows,
      averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0
    };
  }
}
