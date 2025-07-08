/**
 * @file: excel-import.service.ts
 * @description: Улучшенный сервис для загрузки и обработки Excel файлов (с ExcelJS)
 * @created: 2025-07-03
 */
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import { ExcelFile } from '../../database/entities/excel-file.entity';

// Интерфейсы для работы с данными
export interface ColumnMapping {
  [key: string]: string; // key - буква колонки (C, E, G, K), value - название поля
}

export interface ExcelRowData {
  drawingNumber?: string;   // Номер чертежа (C)
  quantity?: number;        // Количество (E)
  deadline?: string;        // Дедлайн (G) - строка в формате YYYY-MM-DD
  priority?: string;        // Приоритет (K)
  [key: string]: any;       // Дополнительные поля
}

export interface UploadResult {
  id: number;
  originalName: string;
  rowsCount: number;
  status: string;
  headers: string[];
  preview: ExcelRowData[];
  columnMapping: ColumnMapping;
}

@Injectable()
export class ExcelImportService {
  // Дефолтное сопоставление колонок
  private readonly DEFAULT_COLUMN_MAPPING: ColumnMapping = {
    'C': 'drawingNumber',  // Номер чертежа
    'E': 'quantity',       // Количество
    'G': 'deadline',       // Дедлайн
    'K': 'priority'        // Приоритет
  };

  constructor(
    @InjectRepository(ExcelFile)
    private readonly excelFileRepository: Repository<ExcelFile>,
  ) {}

  /**
   * Загрузка Excel файла в базу данных
   */
  async uploadExcelFile(
    file: Express.Multer.File,
    description?: string,
    uploadedBy?: string,
    customColumnMapping?: ColumnMapping
  ): Promise<UploadResult> {
    try {
      // Валидация файла
      this.validateFile(file);

      // Вычисляем хеш файла для дедупликации
      const fileHash = this.calculateFileHash(file.buffer);

      // Проверяем, не загружен ли уже такой файл
      const existingFile = await this.excelFileRepository.findOne({
        where: { fileHash }
      });

      if (existingFile) {
        return this.formatUploadResult(existingFile, customColumnMapping || this.DEFAULT_COLUMN_MAPPING);
      }

      // Парсим Excel файл
      const parsedData = await this.parseExcelFile(file.buffer);

      // Создаем запись в БД
      const excelFile = new ExcelFile();
      excelFile.originalName = file.originalname;
      excelFile.description = description || '';
      excelFile.fileSize = file.size;
      excelFile.mimeType = file.mimetype;
      excelFile.fileHash = fileHash;
      excelFile.fileData = file.buffer;
      excelFile.headers = parsedData.headers;
      excelFile.sheetsCount = parsedData.sheetsCount;
      excelFile.uploadedBy = uploadedBy || 'anonymous';
      excelFile.status = 'parsed';

      // Обрабатываем данные с учетом маппинга колонок
      const processedData = this.processDataWithMapping(
        parsedData.data,
        customColumnMapping || this.DEFAULT_COLUMN_MAPPING
      );

      excelFile.setParsedData(processedData);

      // Сохраняем в БД
      const savedFile = await this.excelFileRepository.save(excelFile);

      return this.formatUploadResult(savedFile, customColumnMapping || this.DEFAULT_COLUMN_MAPPING);

    } catch (error) {
      console.error('Ошибка при загрузке Excel файла:', error);
      throw new InternalServerErrorException('Не удалось загрузить файл');
    }
  }

  /**
   * Получение данных файла с возможностью изменения маппинга колонок
   */
  async getFileDataWithMapping(
    fileId: number,
    columnMapping?: ColumnMapping
  ): Promise<{ data: ExcelRowData[]; mapping: ColumnMapping }> {
    const file = await this.excelFileRepository.findOne({
      where: { id: fileId }
    });

    if (!file) {
      throw new BadRequestException('Файл не найден');
    }

    const rawData = file.getParsedDataAsJson();
    const mapping = columnMapping || this.DEFAULT_COLUMN_MAPPING;
    const processedData = this.processDataWithMapping(rawData, mapping);

    return {
      data: processedData,
      mapping
    };
  }

  /**
   * Получение списка загруженных файлов
   */
  async getExcelFilesList(page: number = 1, limit: number = 10) {
    const [files, total] = await this.excelFileRepository.findAndCount({
      select: ['id', 'originalName', 'description', 'fileSize', 'rowsCount', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: files,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Удаление файла
   */
  async deleteExcelFile(fileId: number): Promise<void> {
    const result = await this.excelFileRepository.delete(fileId);
    if (result.affected === 0) {
      throw new BadRequestException('Файл не найден');
    }
  }

  /**
   * Получение статистики по файлам
   */
  async getStatistics() {
    const [totalFiles, totalSize, totalRows] = await Promise.all([
      this.excelFileRepository.count(),
      this.excelFileRepository
        .createQueryBuilder('excel')
        .select('SUM(excel.fileSize)', 'sum')
        .getRawOne()
        .then(result => parseInt(result.sum) || 0),
      this.excelFileRepository
        .createQueryBuilder('excel')
        .select('SUM(excel.rowsCount)', 'sum')
        .getRawOne()
        .then(result => parseInt(result.sum) || 0),
    ]);

    return {
      totalFiles,
      totalSize,
      totalRows,
    };
  }

  /**
   * Валидация загружаемого файла
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Поддерживаются только Excel файлы (.xlsx, .xls)');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла не должен превышать 10MB');
    }
  }

  /**
   * Вычисление хеша файла для дедупликации
   */
  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Парсинг Excel файла с помощью ExcelJS
   */
  private async parseExcelFile(buffer: Buffer): Promise<{
    data: any[];
    headers: string[];
    sheetsCount: number;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1); // Первый лист
      if (!worksheet) {
        throw new BadRequestException('Excel файл пуст или поврежден');
      }

      const data: any[] = [];
      const headers: string[] = [];

      // Получаем заголовки из первой строки
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? String(cell.value) : `Column ${this.numberToColumn(colNumber)}`;
      });

      // Получаем данные начиная со второй строки
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Пропускаем заголовки

        const rowData: any[] = [];
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          const value = cell.value;
          rowData[colNumber - 1] = value;
          if (value !== null && value !== undefined && value !== '') {
            hasData = true;
          }
        });

        if (hasData) {
          data.push(rowData);
        }
      });

      return {
        data,
        headers,
        sheetsCount: workbook.worksheets.length,
      };

    } catch (error) {
      console.error('Ошибка парсинга Excel файла:', error);
      throw new BadRequestException('Не удалось прочитать Excel файл');
    }
  }

  /**
   * Конвертация номера колонки в букву (1 -> A, 2 -> B, ...)
   */
  private numberToColumn(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode('A'.charCodeAt(0) + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * Обработка данных с учетом маппинга колонок
   */
  private processDataWithMapping(rawData: any[], columnMapping: ColumnMapping): ExcelRowData[] {
    const processedData: ExcelRowData[] = [];

    console.log('📂 Обработка данных Excel:', { 
      totalRows: rawData.length, 
      columnMapping,
      sampleRawData: rawData.slice(0, 3)
    });

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const processedRow: ExcelRowData = {};
      let hasValidData = false;

      console.log(`🔍 Обработка строки ${i + 1}:`, row);

      // Обрабатываем каждую колонку согласно маппингу
      Object.entries(columnMapping).forEach(([columnLetter, fieldName]) => {
        if (!fieldName || fieldName.trim() === '') {
          return; // Пропускаем неназначенные колонки
        }

        const columnIndex = this.columnLetterToIndex(columnLetter);
        const cellValue = Array.isArray(row) ? row[columnIndex] : null;

        console.log(`  • Колонка ${columnLetter} (индекс ${columnIndex}) -> ${fieldName}:`, cellValue);

        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          const formattedValue = this.formatCellValue(cellValue, fieldName);
          console.log(`    → Отформатировано:`, formattedValue);
          
          if (formattedValue !== null && formattedValue !== undefined) {
            processedRow[fieldName] = formattedValue;
            hasValidData = true;
          }
        }
      });

      // Добавляем строку только если в ней есть хоть какие-то данные
      if (hasValidData) {
        // Убеждаемся что у нас есть минимальные данные для создания заказа
        if (processedRow.drawingNumber || processedRow.quantity || processedRow.deadline) {
          // Валидируем и исправляем данные
          const validatedRow = this.validateAndFixRowData(processedRow, i + 1);
          processedData.push(validatedRow);
        }
      }
    }

    console.log('✅ Обработанные данные:', { 
      totalProcessed: processedData.length,
      sampleData: processedData.slice(0, 2)
    });

    return processedData;
  }

  /**
   * Валидация и исправление данных строки
   */
  private validateAndFixRowData(row: ExcelRowData, rowNumber: number): ExcelRowData {
    const validatedRow: ExcelRowData = { ...row };

    // Валидация drawingNumber - должен быть строкой
    if (!validatedRow.drawingNumber || typeof validatedRow.drawingNumber !== 'string') {
      validatedRow.drawingNumber = `ORDER_${Date.now()}_${rowNumber}`;
      console.log(`⚠️ Исправлен drawingNumber для строки ${rowNumber}:`, validatedRow.drawingNumber);
    }

    // Валидация quantity - должен быть положительным целым числом
    if (!validatedRow.quantity || typeof validatedRow.quantity !== 'number' || validatedRow.quantity <= 0 || isNaN(validatedRow.quantity)) {
      validatedRow.quantity = 1;
      console.log(`⚠️ Исправлен quantity для строки ${rowNumber}:`, validatedRow.quantity);
    }

    // Валидация deadline - должен быть строкой в формате YYYY-MM-DD
    if (!validatedRow.deadline || typeof validatedRow.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(validatedRow.deadline)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      validatedRow.deadline = tomorrow.toISOString().split('T')[0];
      console.log(`⚠️ Исправлен deadline для строки ${rowNumber}:`, validatedRow.deadline);
    }

    // Валидация priority - должен быть непустой строкой
    if (!validatedRow.priority || typeof validatedRow.priority !== 'string' || validatedRow.priority.trim() === '') {
      validatedRow.priority = 'Средний';
      console.log(`⚠️ Исправлен priority для строки ${rowNumber}:`, validatedRow.priority);
    }

    return validatedRow;
  }

  /**
   * Конвертация буквы колонки в индекс (A=0, B=1, C=2, ...)
   */
  private columnLetterToIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return index - 1;
  }

  /**
   * Форматирование значения ячейки в зависимости от типа поля
   */
  private formatCellValue(value: any, fieldName: string): any {
    // Проверяем на пустые значения
    if (value === null || value === undefined || value === '') {
      console.log(`    ⚠️ Пустое значение для ${fieldName}`);
      return null;
    }

    console.log(`    🔧 Форматирование ${fieldName}:`, { value, type: typeof value, isDate: value instanceof Date });

    try {
      switch (fieldName) {
        case 'quantity':
          if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            const result = Math.floor(Math.abs(value));
            console.log(`    ✅ quantity: ${value} -> ${result}`);
            return result > 0 ? result : 1;
          }
          
          if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && isFinite(numValue)) {
              const result = Math.floor(Math.abs(numValue));
              console.log(`    ✅ quantity from string: "${value}" -> ${result}`);
              return result > 0 ? result : 1;
            }
          }
          
          console.log(`    ❌ Невалидное количество: ${value}, возвращаем 1`);
          return 1;
        
        case 'deadline':
          // Обработка дат Excel
          if (value instanceof Date && !isNaN(value.getTime())) {
            const result = value.toISOString().split('T')[0];
            console.log(`    ✅ deadline from Date: ${value} -> ${result}`);
            return result;
          }
          
          if (typeof value === 'number' && value > 25567 && value < 50000) { // Excel серийная дата
            try {
              const excelEpoch = new Date(1900, 0, 1);
              const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
              if (!isNaN(date.getTime())) {
                const result = date.toISOString().split('T')[0];
                console.log(`    ✅ deadline from Excel serial: ${value} -> ${result}`);
                return result;
              }
            } catch (error) {
              console.log(`    ❌ Ошибка преобразования Excel даты: ${value}`);
            }
          }
          
          if (typeof value === 'string') {
            // Проверяем что это уже валидная дата в формате YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
              console.log(`    ✅ deadline already valid: ${value}`);
              return value.trim();
            }
            
            // Пытаемся распарсить как дату
            const parsed = new Date(value.trim());
            if (!isNaN(parsed.getTime())) {
              const result = parsed.toISOString().split('T')[0];
              console.log(`    ✅ deadline from string: "${value}" -> ${result}`);
              return result;
            }
            
            // Если не удалось распарсить как дату, сохраняем как строку
            console.log(`    ⚠️ deadline не является датой, сохраняем как строку: "${value}"`);
            return value.trim();
          }
          
          console.log(`    ❌ Невалидный deadline: ${value}`);
          return null;
        
        case 'drawingNumber':
          // Номер чертежа всегда строка
          if (value instanceof Date) {
            // Если по ошибке передали дату, конвертируем в строку
            const result = value.toISOString().split('T')[0];
            console.log(`    ⚠️ drawingNumber from Date: ${value} -> "${result}"`);
            return result;
          }
          
          const drawingStr = String(value).trim();
          if (drawingStr.length > 0) {
            console.log(`    ✅ drawingNumber: ${value} -> "${drawingStr}"`);
            return drawingStr;
          }
          
          console.log(`    ❌ Пустой drawingNumber: ${value}`);
          return null;
        
        case 'priority':
          // Приоритет всегда строка
          const priorityStr = String(value).trim();
          if (priorityStr.length > 0) {
            console.log(`    ✅ priority: ${value} -> "${priorityStr}"`);
            return priorityStr;
          }
          
          console.log(`    ❌ Пустой priority: ${value}`);
          return null;
        
        default:
          // Для неизвестных полей возвращаем как строку
          if (value instanceof Date) {
            return value.toISOString();
          }
          const defaultStr = String(value).trim();
          console.log(`    ✅ default field ${fieldName}: ${value} -> "${defaultStr}"`);
          return defaultStr;
      }
    } catch (error) {
      console.error(`    ❌ Ошибка форматирования значения ${value} для поля ${fieldName}:`, error);
      
      // Возвращаем дефолтные значения в случае ошибки
      switch (fieldName) {
        case 'quantity': return 1;
        case 'priority': return 'Средний';
        case 'drawingNumber': return String(value).trim() || 'UNKNOWN';
        case 'deadline': 
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        default: return String(value).trim();
      }
    }
  }

  /**
   * Форматирование результата загрузки
   */
  private formatUploadResult(file: ExcelFile, columnMapping: ColumnMapping): UploadResult {
    const data = file.getParsedDataAsJson();
    const processedData = this.processDataWithMapping(data, columnMapping);

    return {
      id: file.id,
      originalName: file.originalName,
      rowsCount: file.rowsCount,
      status: file.status,
      headers: file.headers || [],
      preview: processedData.slice(0, 10), // Первые 10 строк для предварительного просмотра
      columnMapping,
    };
  }

  /**
   * Обновление маппинга колонок для файла
   */
  async updateColumnMapping(fileId: number, newMapping: ColumnMapping): Promise<ExcelRowData[]> {
    const file = await this.excelFileRepository.findOne({
      where: { id: fileId }
    });

    if (!file) {
      throw new BadRequestException('Файл не найден');
    }

    // Обновляем метаданные файла с новым маппингом
    file.metadata = { ...file.metadata, columnMapping: newMapping };
    await this.excelFileRepository.save(file);

    // Возвращаем данные с новым маппингом
    const rawData = file.getParsedDataAsJson();
    return this.processDataWithMapping(rawData, newMapping);
  }
}
