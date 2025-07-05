/**
 * @file: excel-import-db.service.ts
 * @description: Новый сервис для импорта Excel с сохранением в базу данных
 * @created: 2025-06-30
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { MulterFile } from '../../types/express';

// Entities
import { ExcelImport, ImportStatus } from '../../database/entities/excel/excel-import.entity';
import { ExcelData, DataType } from '../../database/entities/excel/excel-data.entity';
import { ImportFilter } from '../../database/entities/excel/import-filter.entity';
import { Order, Priority } from '../../database/entities/order.entity';
import { Operation, OperationType } from '../../database/entities/operation.entity';

export interface ImportResult {
  id: number;
  filename: string;
  status: ImportStatus;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; error: string }>;
  headers: string[];
  rowsCount: number;
  dataPreview: any[];
}

export interface FilterConfig {
  required_columns: string[];
  optional_columns?: string[];
  data_validation: Record<string, any>;
  skip_empty_rows?: boolean;
  header_row?: number;
}

@Injectable()
export class ExcelImportDbService {
  private readonly logger = new Logger(ExcelImportDbService.name);
  private readonly uploadsPath = join(process.cwd(), 'uploads', 'excel');

  constructor(
    @InjectRepository(ExcelImport)
    private readonly excelImportRepository: Repository<ExcelImport>,
    @InjectRepository(ExcelData)
    private readonly excelDataRepository: Repository<ExcelData>,
    @InjectRepository(ImportFilter)
    private readonly importFilterRepository: Repository<ImportFilter>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsPath);
    } catch {
      await fs.mkdir(this.uploadsPath, { recursive: true });
    }
  }

  /**
   * Основной метод для импорта Excel файла
   */
  async importExcelFile(
    file: MulterFile,
    targetTable: string = 'orders',
    filterId?: number,
  ): Promise<ImportResult> {
    this.logger.log(`Начало импорта Excel файла: ${file.originalname}`);

    // Создаем запись о импорте
    const excelImport = await this.createImportRecord(file);

    try {
      // Парсим Excel файл
      const parsedData = await this.parseExcelFile(file, excelImport.id);
      
      // Обновляем статистику парсинга
      await this.updateImportStatistics(excelImport.id, parsedData);

      // Получаем фильтр для импорта
      const filter = await this.getImportFilter(filterId, targetTable);

      // Импортируем данные в целевую таблицу
      const importResult = await this.importToTargetTable(
        excelImport.id,
        parsedData,
        filter,
        targetTable,
      );

      // Обновляем статус импорта
      await this.updateImportStatus(
        excelImport.id,
        ImportStatus.PROCESSED,
        targetTable,
      );

      return {
        id: excelImport.id,
        filename: file.originalname,
        status: ImportStatus.PROCESSED,
        ...importResult,
        headers: parsedData.headers,
        rowsCount: parsedData.rows.length,
        dataPreview: parsedData.rows.slice(0, 5),
      };

    } catch (error) {
      this.logger.error(`Ошибка импорта Excel: ${error.message}`, error.stack);
      
      await this.updateImportStatus(
        excelImport.id,
        ImportStatus.ERROR,
        targetTable,
        error.message,
      );

      throw new BadRequestException(`Ошибка импорта: ${error.message}`);
    }
  }

  /**
   * Создание записи о импорте в базе данных
   */
  private async createImportRecord(file: MulterFile): Promise<ExcelImport> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = join(this.uploadsPath, filename);
    
    // Сохраняем файл на диск
    await fs.writeFile(filePath, file.buffer);

    const excelImport = this.excelImportRepository.create({
      filename,
      original_filename: file.originalname,
      file_path: filePath,
      file_size: file.size,
      mimetype: file.mimetype,
      status: ImportStatus.PROCESSING,
    });

    return await this.excelImportRepository.save(excelImport);
  }

  /**
   * Парсинг Excel файла
   */
  private async parseExcelFile(
    file: MulterFile,
    importId: number,
  ): Promise<{ headers: string[]; rows: any[]; sheetsCount: number }> {
    this.logger.log(`Парсинг Excel файла для импорта ${importId}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    if (workbook.worksheets.length === 0) {
      throw new BadRequestException('Excel файл не содержит рабочих листов');
    }

    const worksheet = workbook.getWorksheet(1);
    const headers: string[] = [];
    const rows: any[] = [];

    // Получаем заголовки из первой строки
    const headerRow = worksheet.getRow(1);
    for (let colNum = 1; colNum <= headerRow.cellCount; colNum++) {
      const cell = headerRow.getCell(colNum);
      const headerValue = this.safeCellValue(cell) || `Колонка ${colNum}`;
      headers.push(String(headerValue));
    }

    // Читаем данные построчно
    const maxRows = Math.min(worksheet.rowCount, 10000); // Ограничиваем 10000 строками
    
    for (let rowNum = 2; rowNum <= maxRows; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const rowData: any = {};
      let hasData = false;

      for (let colNum = 1; colNum <= headers.length; colNum++) {
        const cell = row.getCell(colNum);
        const cellValue = this.safeCellValue(cell);
        const header = headers[colNum - 1];

        if (cellValue !== null && cellValue !== '') {
          rowData[header] = cellValue;
          hasData = true;

          // Сохраняем ячейку в excel_data
          await this.saveExcelDataCell(
            importId,
            worksheet.name,
            rowNum,
            header,
            cellValue,
          );
        }
      }

      if (hasData) {
        rows.push(rowData);
      }
    }

    this.logger.log(`Парсинг завершен: ${headers.length} заголовков, ${rows.length} строк`);

    return {
      headers,
      rows,
      sheetsCount: workbook.worksheets.length,
    };
  }

  /**
   * Сохранение ячейки в таблицу excel_data
   */
  private async saveExcelDataCell(
    importId: number,
    sheetName: string,
    rowNumber: number,
    columnName: string,
    cellValue: any,
  ): Promise<void> {
    const dataType = this.determineDataType(cellValue);
    
    const excelData = this.excelDataRepository.create({
      excel_import_id: importId,
      sheet_name: sheetName,
      row_number: rowNumber,
      column_name: columnName,
      cell_value: String(cellValue),
      data_type: dataType,
    });

    await this.excelDataRepository.save(excelData);
  }

  /**
   * Определение типа данных
   */
  private determineDataType(value: any): DataType {
    if (typeof value === 'number') return DataType.NUMBER;
    if (typeof value === 'boolean') return DataType.BOOLEAN;
    if (value instanceof Date) return DataType.DATE;
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return DataType.DATE;
    return DataType.STRING;
  }

  /**
   * Безопасное извлечение значения ячейки
   */
  private safeCellValue(cell: ExcelJS.Cell): string | number | null {
    try {
      if (!cell || cell.value === null || cell.value === undefined) {
        return null;
      }

      const value = cell.value;
      
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }

      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }

      if (typeof value === 'object' && 'result' in value) {
        const result = (value as any).result;
        return typeof result === 'string' || typeof result === 'number' ? result : String(result);
      }

      if (typeof value === 'object' && 'richText' in value) {
        return (value as any).richText.map((rt: any) => rt.text || '').join('');
      }

      return String(value);
    } catch (error) {
      this.logger.warn(`Ошибка при извлечении значения ячейки: ${error.message}`);
      return null;
    }
  }

  /**
   * Получение фильтра для импорта
   */
  private async getImportFilter(
    filterId?: number,
    targetTable?: string,
  ): Promise<ImportFilter | null> {
    if (filterId) {
      return await this.importFilterRepository.findOne({ where: { id: filterId } });
    }

    if (targetTable) {
      return await this.importFilterRepository.findOne({
        where: { target_table: targetTable, is_active: true },
      });
    }

    return null;
  }

  /**
   * Импорт данных в целевую таблицу
   */
  private async importToTargetTable(
    importId: number,
    parsedData: { headers: string[]; rows: any[] },
    filter: ImportFilter | null,
    targetTable: string,
  ): Promise<{ created: number; updated: number; skipped: number; errors: any[] }> {
    const result = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    if (targetTable === 'orders') {
      return await this.importToOrders(parsedData, filter, result);
    } else if (targetTable === 'operations') {
      return await this.importToOperations(parsedData, filter, result);
    }

    throw new BadRequestException(`Неподдерживаемая целевая таблица: ${targetTable}`);
  }

  /**
   * Импорт в таблицу orders
   */
  private async importToOrders(
    parsedData: { headers: string[]; rows: any[] },
    filter: ImportFilter | null,
    result: any,
  ): Promise<any> {
    const columnMapping = filter?.column_mapping || {};
    
    for (let i = 0; i < parsedData.rows.length; i++) {
      const row = parsedData.rows[i];
      
      try {
        // Маппинг колонок
        const mappedRow = this.mapColumns(row, columnMapping);
        
        // Валидация данных с учетом фильтра
        const validatedData = this.validateOrderData(mappedRow, i + 2, filter);
        
        if (!validatedData) {
          result.skipped++;
          continue;
        }

        // Проверяем существующий заказ
        const existingOrder = await this.orderRepository.findOne({
          where: { drawingNumber: validatedData.drawing_number },
        });

        if (existingOrder) {
          // Обновляем существующий заказ
          await this.orderRepository.update(existingOrder.id, {
            quantity: validatedData.quantity,
            deadline: validatedData.deadline,
            priority: validatedData.priority,
            workType: validatedData.workType,
          });
          result.updated++;
        } else {
          // Создаем новый заказ
          const newOrder = this.orderRepository.create({
            drawingNumber: validatedData.drawing_number,
            quantity: validatedData.quantity,
            remainingQuantity: validatedData.quantity,
            deadline: validatedData.deadline,
            priority: validatedData.priority || Priority.MEDIUM,
            workType: validatedData.workType,
            status: 'planned',
          });
          
          await this.orderRepository.save(newOrder);
          result.created++;
        }

      } catch (error) {
        result.errors.push({
          row: i + 2,
          field: 'general',
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Импорт в таблицу operations
   */
  private async importToOperations(
    parsedData: { headers: string[]; rows: any[] },
    filter: ImportFilter | null,
    result: any,
  ): Promise<any> {
    // Здесь будет логика импорта операций
    throw new BadRequestException('Импорт операций пока не реализован');
  }

  /**
   * Маппинг колонок согласно настройкам фильтра
   */
  private mapColumns(row: any, columnMapping: any): any {
    const mappedRow: any = {};
    
    Object.keys(row).forEach(originalColumn => {
      const mappedColumn = columnMapping[originalColumn] || originalColumn;
      mappedRow[mappedColumn] = row[originalColumn];
    });

    return mappedRow;
  }

  /**
   * Валидация данных заказа (гибкая версия)
   */
  private validateOrderData(row: any, rowNumber: number, filter?: ImportFilter | null): any | null {
    // Получаем номер чертежа из разных возможных колонок
    const drawingNumber = row.drawing_number || row['Номер чертежа'] || row['мқт'] || row['drawing_number'] || row['part_number'];
    
    // Получаем количество
    const quantity = parseInt(row.quantity || row['Количество'] || row['қмот'] || row['qty']) || 0;
    
    // Получаем дату (необязательно)
    const deadline = this.parseDate(row.deadline || row['Срок'] || row['ت.اسپқة'] || row['due_date']);

    // Обязательная проверка номера чертежа
    if (!drawingNumber) {
      this.logger.warn(`Строка ${rowNumber}: отсутствует номер чертежа`);
      return null;
    }

    // Обязательная проверка количества
    if (quantity <= 0) {
      this.logger.warn(`Строка ${rowNumber}: некорректное количество`);
      return null;
    }

    // Гибкая проверка даты (не обязательно для гибких фильтров)
    const isFlexible = filter?.filter_config?.allow_missing_deadline || filter?.filter_config?.flexible_validation;
    
    if (!deadline && !isFlexible) {
      this.logger.warn(`Строка ${rowNumber}: некорректная дата`);
      return null;
    }

    return {
      drawing_number: drawingNumber,
      quantity,
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // По умолчанию +30 дней
      priority: this.parsePriority(row.priority || row['Приоритет'] || row['دچيپоت']),
      workType: row.workType || row['Тип работы'] || row['سييس'] || 'Production',
      customer: row.customer || row['Лўқоت'] || null,
      order_number: row.order_number || row['هزмнة'] || null,
    };
  }

  /**
   * Парсинг даты
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;
    
    if (value instanceof Date) return value;
    
    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  }

  /**
   * Парсинг приоритета
   */
  private parsePriority(value: any): Priority {
    if (!value) return Priority.MEDIUM;
    
    const priorityMap: Record<string, Priority> = {
      '1': Priority.CRITICAL,
      'критический': Priority.CRITICAL,
      'critical': Priority.CRITICAL,
      '2': Priority.HIGH,
      'высокий': Priority.HIGH,
      'high': Priority.HIGH,
      '3': Priority.MEDIUM,
      'средний': Priority.MEDIUM,
      'medium': Priority.MEDIUM,
      '4': Priority.LOW,
      'низкий': Priority.LOW,
      'low': Priority.LOW,
    };

    const priority = priorityMap[String(value).toLowerCase()];
    return priority || Priority.MEDIUM;
  }

  /**
   * Обновление статистики импорта
   */
  private async updateImportStatistics(
    importId: number,
    parsedData: { headers: string[]; rows: any[] },
  ): Promise<void> {
    await this.excelImportRepository.update(importId, {
      headers_count: parsedData.headers.length,
      rows_count: parsedData.rows.length,
      data_preview: parsedData.rows.slice(0, 5),
    });
  }

  /**
   * Обновление статуса импорта
   */
  private async updateImportStatus(
    importId: number,
    status: ImportStatus,
    targetTable?: string,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      processed_date: new Date(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (targetTable === 'orders') {
      updateData.imported_to_orders = status === ImportStatus.PROCESSED;
    } else if (targetTable === 'operations') {
      updateData.imported_to_operations = status === ImportStatus.PROCESSED;
    }

    await this.excelImportRepository.update(importId, updateData);
  }

  /**
   * Получение списка всех импортов
   */
  async getImportsList(page: number = 1, limit: number = 20): Promise<{
    imports: ExcelImport[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [imports, total] = await this.excelImportRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      imports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получение деталей импорта
   */
  async getImportDetails(importId: number): Promise<{
    import: ExcelImport;
    dataPreview: any[];
  }> {
    const importRecord = await this.excelImportRepository.findOne({
      where: { id: importId },
    });

    if (!importRecord) {
      throw new BadRequestException('Импорт не найден');
    }

    // Получаем превью данных
    const dataPreview = await this.excelDataRepository
      .createQueryBuilder('data')
      .where('data.excel_import_id = :importId', { importId })
      .andWhere('data.row_number <= 10')
      .orderBy('data.row_number, data.column_name')
      .getMany();

    return {
      import: importRecord,
      dataPreview,
    };
  }

  /**
   * Получение фильтров
   */
  async getImportFilters(targetTable?: string): Promise<ImportFilter[]> {
    const where: any = { is_active: true };
    if (targetTable) {
      where.target_table = targetTable;
    }

    return await this.importFilterRepository.find({ where });
  }

  /**
   * Создание нового фильтра
   */
  async createImportFilter(filterData: any): Promise<ImportFilter> {
    // Временное решение для решения TypeScript проблемы
    throw new BadRequestException('Создание фильтров временно отключено. Используйте существующие фильтры.');
  }

  /**
   * Обновление фильтра
   */
  async updateImportFilter(id: number, filterData: any): Promise<ImportFilter> {
    await this.importFilterRepository.update(id, filterData);
    const updatedFilter = await this.importFilterRepository.findOne({ where: { id } });
    if (!updatedFilter) {
      throw new BadRequestException('Фильтр не найден');
    }
    return updatedFilter;
  }

  /**
   * Удаление фильтра
   */
  async deleteImportFilter(id: number): Promise<void> {
    const result = await this.importFilterRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException('Фильтр не найден');
    }
  }

  /**
   * Повторный импорт
   */
  async reImportExcel(
    importId: number,
    targetTable: string,
    filterId?: number,
  ): Promise<ImportResult> {
    const importRecord = await this.excelImportRepository.findOne({
      where: { id: importId },
    });

    if (!importRecord) {
      throw new BadRequestException('Импорт не найден');
    }

    // Читаем файл с диска
    const fileBuffer = await fs.readFile(importRecord.file_path);
    const file: MulterFile = {
      fieldname: 'file',
      originalname: importRecord.original_filename,
      encoding: '7bit',
      buffer: fileBuffer,
      size: importRecord.file_size,
      mimetype: importRecord.mimetype,
    };

    // Обновляем статус на processing
    await this.excelImportRepository.update(importId, {
      status: ImportStatus.PROCESSING,
      error_message: null,
    });

    // Парсим данные из сохраненных ячеек
    const excelData = await this.excelDataRepository.find({
      where: { excel_import_id: importId },
      order: { row_number: 'ASC', column_name: 'ASC' },
    });

    const parsedData = this.reconstructDataFromCells(excelData);
    const filter = await this.getImportFilter(filterId, targetTable);

    try {
      const importResult = await this.importToTargetTable(
        importId,
        parsedData,
        filter,
        targetTable,
      );

      await this.updateImportStatus(importId, ImportStatus.PROCESSED, targetTable);

      return {
        id: importId,
        filename: importRecord.original_filename,
        status: ImportStatus.PROCESSED,
        ...importResult,
        headers: parsedData.headers,
        rowsCount: parsedData.rows.length,
        dataPreview: parsedData.rows.slice(0, 5),
      };

    } catch (error) {
      await this.updateImportStatus(
        importId,
        ImportStatus.ERROR,
        targetTable,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Восстановление данных из сохраненных ячеек
   */
  private reconstructDataFromCells(excelData: ExcelData[]): { headers: string[]; rows: any[] } {
    const headers: string[] = [];
    const rows: any[] = [];
    const dataByRow: Record<number, Record<string, any>> = {};

    // Группируем данные по строкам
    excelData.forEach(cell => {
      if (!dataByRow[cell.row_number]) {
        dataByRow[cell.row_number] = {};
      }
      dataByRow[cell.row_number][cell.column_name] = cell.cell_value;
      
      // Собираем уникальные заголовки
      if (!headers.includes(cell.column_name)) {
        headers.push(cell.column_name);
      }
    });

    // Преобразуем в массив строк
    Object.keys(dataByRow)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(rowNumber => {
        if (parseInt(rowNumber) > 1) { // Пропускаем заголовок
          rows.push(dataByRow[parseInt(rowNumber)]);
        }
      });

    return { headers, rows };
  }

  /**
   * Получение схемы таблицы базы данных
   */
  async getDatabaseSchema(tableName: string): Promise<any> {
    this.logger.log(`📋 Получаем схему таблицы: ${tableName}`);
    
    if (tableName === 'orders') {
      return {
        table: 'orders',
        columns: [
          { name: 'id', type: 'integer', required: true, description: 'Уникальный идентификатор (авто)' },
          { name: 'drawing_number', type: 'string', required: true, description: 'Номер чертежа' },
          { name: 'quantity', type: 'integer', required: true, description: 'Количество' },
          { name: 'deadline', type: 'date', required: true, description: 'Срок выполнения' },
          { name: 'priority', type: 'integer', required: true, description: 'Приоритет (1-4)' },
          { name: 'workType', type: 'string', required: false, description: 'Тип работы' },
          { name: 'pdfPath', type: 'string', required: false, description: 'Путь к PDF файлу' },
          { name: 'createdAt', type: 'timestamp', required: false, description: 'Дата создания (авто)' },
          { name: 'updatedAt', type: 'timestamp', required: false, description: 'Дата обновления (авто)' }
        ]
      };
    } else if (tableName === 'operations') {
      return {
        table: 'operations',
        columns: [
          { name: 'id', type: 'integer', required: true, description: 'Уникальный идентификатор' },
          { name: 'order_id', type: 'integer', required: true, description: 'ID заказа' },
          { name: 'operation_name', type: 'string', required: true, description: 'Название операции' },
          { name: 'sequence', type: 'integer', required: true, description: 'Порядок выполнения' },
          { name: 'planned_duration', type: 'integer', required: true, description: 'Плановое время (мин)' },
          { name: 'machine_id', type: 'integer', required: false, description: 'ID станка' },
          { name: 'operator_id', type: 'integer', required: false, description: 'ID оператора' }
        ]
      };
    }
    
    throw new BadRequestException(`Неподдерживаемая таблица: ${tableName}`);
  }

  /**
   * Анализ структуры Excel файла без импорта
   */
  async analyzeExcelStructure(file: MulterFile): Promise<any> {
    this.logger.log(`🔍 Анализируем структуру Excel файла: ${file.originalname}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    if (workbook.worksheets.length === 0) {
      throw new BadRequestException('Excel файл не содержит рабочих листов');
    }

    const worksheet = workbook.getWorksheet(1);
    const columns: any[] = [];
    const sampleData: any[] = [];

    // Получаем заголовки
    const headerRow = worksheet.getRow(1);
    for (let colNum = 1; colNum <= headerRow.cellCount; colNum++) {
      const cell = headerRow.getCell(colNum);
      const headerValue = this.safeCellValue(cell) || `Колонка ${colNum}`;
      
      // Анализируем колонку
      const columnAnalysis = this.analyzeColumn(worksheet, colNum, String(headerValue));
      columns.push(columnAnalysis);
    }

    // Получаем примеры данных
    const maxRows = Math.min(worksheet.rowCount, 6); // Первые 5 строк
    for (let rowNum = 2; rowNum <= maxRows; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const rowData: any = {};
      
      for (let colNum = 1; colNum <= columns.length; colNum++) {
        const cell = row.getCell(colNum);
        const cellValue = this.safeCellValue(cell);
        const header = columns[colNum - 1].name;
        rowData[header] = cellValue;
      }
      
      sampleData.push(rowData);
    }

    return {
      filename: file.originalname,
      sheets: [{
        name: worksheet.name,
        totalRows: worksheet.rowCount,
        totalColumns: columns.length
      }],
      columns,
      sampleData,
      analysis: {
        hasHeaders: true,
        totalRows: worksheet.rowCount - 1, // Без заголовка
        totalColumns: columns.length,
        detectedLanguage: this.detectLanguage(columns.map(c => c.name))
      }
    };
  }

  /**
   * Анализ колонки
   */
  private analyzeColumn(worksheet: any, colNum: number, headerName: string): any {
    const values: any[] = [];
    const maxRows = Math.min(worksheet.rowCount, 100); // Анализируем 100 строк
    
    // Собираем значения
    for (let rowNum = 2; rowNum <= maxRows; rowNum++) {
      const cell = worksheet.getRow(rowNum).getCell(colNum);
      const cellValue = this.safeCellValue(cell);
      if (cellValue !== null && cellValue !== '') {
        values.push(cellValue);
      }
    }

    // Определяем тип данных
    const dataType = this.detectColumnDataType(values);
    const uniqueValues = new Set(values).size;
    const fillRate = values.length / (maxRows - 1);

    return {
      name: headerName,
      index: colNum - 1,
      dataType,
      sampleValues: values.slice(0, 5),
      totalValues: values.length,
      uniqueValues,
      fillRate: Math.round(fillRate * 100),
      isEmpty: values.length === 0,
      suggestedDbColumn: this.suggestDbColumn(headerName, dataType)
    };
  }

  /**
   * Определение типа данных колонки
   */
  private detectColumnDataType(values: any[]): string {
    if (values.length === 0) return 'unknown';
    
    let numberCount = 0;
    let dateCount = 0;
    let textCount = 0;
    
    values.slice(0, 20).forEach(value => { // Проверяем первые 20 значений
      if (typeof value === 'number') {
        numberCount++;
      } else if (value instanceof Date) {
        dateCount++;
      } else if (typeof value === 'string') {
        if (!isNaN(Number(value))) {
          numberCount++;
        } else if (!isNaN(Date.parse(value))) {
          dateCount++;
        } else {
          textCount++;
        }
      }
    });
    
    const total = numberCount + dateCount + textCount;
    if (numberCount / total > 0.8) return 'number';
    if (dateCount / total > 0.6) return 'date';
    return 'text';
  }

  /**
   * Предложение колонки БД
   */
  private suggestDbColumn(headerName: string, dataType: string): string | null {
    const header = headerName.toLowerCase();
    
    // Маппинг для разных языков
    const mappings: Record<string, string> = {
      // Русский
      'номер чертежа': 'drawing_number',
      'чертеж': 'drawing_number',
      'количество': 'quantity',
      'кол-во': 'quantity',
      'срок': 'deadline',
      'дата': 'deadline',
      'приоритет': 'priority',
      'тип работы': 'workType',
      
      // Английский
      'drawing number': 'drawing_number',
      'part number': 'drawing_number',
      'quantity': 'quantity',
      'qty': 'quantity',
      'deadline': 'deadline',
      'due date': 'deadline',
      'priority': 'priority',
      'work type': 'workType',
      'operation': 'workType',
      
      // Иврит
      'мқт': 'drawing_number',
      'қмот': 'quantity',
      'ت.اسپқة': 'deadline',
      'دچيپоت': 'priority',
      'سييس': 'workType',
      'лўқоت': 'customer',
      'هزмнة': 'order_number'
    };
    
    return mappings[header] || null;
  }

  /**
   * Определение языка заголовков
   */
  private detectLanguage(headers: string[]): string {
    const text = headers.join(' ').toLowerCase();
    
    if (/[א-ת]/.test(text)) return 'hebrew';
    if (/[а-я]/.test(text)) return 'russian';
    if (/^[a-z\s]+$/.test(text)) return 'english';
    
    return 'mixed';
  }
}
