/**
 * @file: improved-excel-import.controller.ts
 * @description: Переделанный контроллер для загрузки Excel с дефолтными колонками
 * @created: 2025-07-03
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ImprovedExcelImportService, ExcelUploadOptions, DEFAULT_COLUMN_MAPPING } from './improved-excel-import.service';
import { Response as ExpressResponse } from 'express';
import type { Express } from 'express';

@ApiTags('improved-excel-import')
@Controller('excel-import/v2')
export class ImprovedExcelImportController {
  constructor(private readonly excelService: ImprovedExcelImportService) {}

  @Get('default-mapping')
  @ApiOperation({ 
    summary: 'Получение дефолтного маппинга колонок',
    description: 'Возвращает дефолтное сопоставление колонок: C-номер чертежа, E-количество, G-дедлайн, K-приоритет'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Дефолтное сопоставление колонок',
    schema: {
      example: {
        drawingNumber: 'C',
        quantity: 'E', 
        deadline: 'G',
        priority: 'K'
      }
    }
  })
  getDefaultMapping() {
    return {
      mapping: DEFAULT_COLUMN_MAPPING,
      description: {
        drawingNumber: 'Номер чертежа (колонка C)',
        quantity: 'Количество (колонка E)',
        deadline: 'Срок выполнения (колонка G)',
        priority: 'Приоритет (колонка K)'
      }
    };
  }

  @Post('upload')
  @ApiOperation({ 
    summary: 'Загрузка Excel файла с обработкой дефолтных колонок',
    description: 'Загружает Excel файл и автоматически извлекает данные из колонок C, E, G, K или настраиваемых колонок'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Файл успешно загружен и обработан' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или загрузки файла' })
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || 
                         file.originalname.match(/\.(xlsx?|csv)$/i);
      
      if (isValidType) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Только Excel файлы (.xlsx, .xls) разрешены'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1,
    },
  }))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
    @Body('uploadedBy') uploadedBy?: string,
    @Body('startRow') startRow?: string,
    @Body('maxRows') maxRows?: string,
    @Body('sheetIndex') sheetIndex?: string,
    @Body('skipEmptyRows') skipEmptyRows?: string,
    @Body('drawingNumberColumn') drawingNumberColumn?: string,
    @Body('quantityColumn') quantityColumn?: string,
    @Body('deadlineColumn') deadlineColumn?: string,
    @Body('priorityColumn') priorityColumn?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    const options: ExcelUploadOptions = {
      description,
      uploadedBy,
      startRow: startRow ? parseInt(startRow, 10) : 2,
      maxRows: maxRows ? parseInt(maxRows, 10) : 10000,
      sheetIndex: sheetIndex ? parseInt(sheetIndex, 10) : 0,
      skipEmptyRows: skipEmptyRows !== 'false',
      columnMapping: {}
    };

    // Настраиваемое сопоставление колонок (если указано)
    if (drawingNumberColumn) options.columnMapping!.drawingNumber = drawingNumberColumn.toUpperCase();
    if (quantityColumn) options.columnMapping!.quantity = quantityColumn.toUpperCase();
    if (deadlineColumn) options.columnMapping!.deadline = deadlineColumn.toUpperCase();
    if (priorityColumn) options.columnMapping!.priority = priorityColumn.toUpperCase();

    return this.excelService.uploadAndProcessExcel(file, options);
  }

  @Get('files')
  @ApiOperation({ 
    summary: 'Получение списка загруженных файлов',
    description: 'Возвращает пагинированный список всех загруженных Excel файлов'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы (по умолчанию 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество файлов на странице (по умолчанию 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список файлов получен успешно'
  })
  async getFilesList(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    return this.excelService.getFilesList(pageNum, limitNum);
  }

  @Get('files/:id')
  @ApiOperation({ 
    summary: 'Получение информации о файле',
    description: 'Возвращает подробную информацию о загруженном файле'
  })
  @ApiParam({ name: 'id', description: 'ID файла' })
  @ApiResponse({ 
    status: 200, 
    description: 'Информация о файле получена успешно' 
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async getFile(@Param('id', ParseIntPipe) id: number) {
    const file = await this.excelService.getFile(id);
    return file.getFileInfo();
  }

  @Get('files/:id/data')
  @ApiOperation({ 
    summary: 'Получение данных файла',
    description: 'Возвращает обработанные данные из Excel файла с пагинацией'
  })
  @ApiParam({ name: 'id', description: 'ID файла' })
  @ApiQuery({ name: 'offset', required: false, description: 'Смещение (по умолчанию 0)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество строк (по умолчанию 100)' })
  @ApiResponse({ status: 200, description: 'Данные файла получены успешно' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async getFileData(
    @Param('id', ParseIntPipe) id: number,
    @Query('offset') offset = 0,
    @Query('limit') limit = 100,
  ) {
    const offsetNum = Math.max(0, Number(offset));
    const limitNum = Math.min(1000, Math.max(1, Number(limit)));

    return this.excelService.getFileData(id, offsetNum, limitNum);
  }

  @Delete('files/:id')
  @ApiOperation({ 
    summary: 'Удаление файла',
    description: 'Удаляет файл и все связанные с ним данные из базы данных'
  })
  @ApiParam({ name: 'id', description: 'ID файла' })
  @ApiResponse({ 
    status: 200, 
    description: 'Файл успешно удален',
    schema: {
      example: { message: 'Файл успешно удален' }
    }
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('id', ParseIntPipe) id: number) {
    await this.excelService.deleteFile(id);
    return { message: 'Файл успешно удален' };
  }

  @Get('files/:id/download')
  @ApiOperation({ 
    summary: 'Скачивание оригинального файла',
    description: 'Скачивает оригинальный Excel файл из базы данных'
  })
  @ApiParam({ name: 'id', description: 'ID файла' })
  @ApiResponse({ 
    status: 200, 
    description: 'Файл готов для скачивания',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
      'application/vnd.ms-excel': {}
    }
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Response() res: ExpressResponse,
  ) {
    const file = await this.excelService.getFile(id);
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', file.fileSize.toString());
    
    res.send(file.fileData);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Статистика по Excel файлам',
    description: 'Возвращает общую статистику по загруженным файлам'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Статистика получена успешно',
    schema: {
      example: {
        totalFiles: 25,
        totalSize: 1048576,
        totalRows: 5000,
        averageFileSize: 41943
      }
    }
  })
  async getStats() {
    return this.excelService.getStatistics();
  }

  @Post('validate')
  @ApiOperation({ 
    summary: 'Предварительная валидация Excel файла',
    description: 'Проверяет файл на корректность и показывает предпросмотр без сохранения в БД'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат валидации' })
  @ApiResponse({ status: 400, description: 'Файл не прошел валидацию' })
  @UseInterceptors(FileInterceptor('file'))
  async validateFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    return this.validateExcelFile(file);
  }

  /**
   * Валидация Excel файла с предпросмотром
   */
  private async validateExcelFile(file: Express.Multer.File) {
    const ExcelJS = require('exceljs');
    
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      if (workbook.worksheets.length === 0) {
        throw new BadRequestException('Excel файл не содержит рабочих листов');
      }

      const firstSheet = workbook.worksheets[0];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Получаем заголовки
      const headerRow = firstSheet.getRow(1);
      const headers: string[] = [];
      for (let col = 1; col <= headerRow.cellCount; col++) {
        const cell = headerRow.getCell(col);
        const value = this.getCellValue(cell);
        headers.push(value ? String(value).trim() : `Колонка ${this.getColumnLetter(col)}`);
      }

      // Получаем несколько строк для предпросмотра
      const sampleRows: any[] = [];
      for (let row = 2; row <= Math.min(4, firstSheet.rowCount); row++) {
        const rowData: any[] = [];
        for (let col = 1; col <= headers.length; col++) {
          const cell = firstSheet.getRow(row).getCell(col);
          rowData.push(this.getCellValue(cell));
        }
        sampleRows.push(rowData);
      }

      // Проверяем дефолтные колонки
      const columnMapping = {
        drawingNumber: this.getColumnValue(firstSheet, 'C', 2),
        quantity: this.getColumnValue(firstSheet, 'E', 2),
        deadline: this.getColumnValue(firstSheet, 'G', 2),
        priority: this.getColumnValue(firstSheet, 'K', 2)
      };

      // Предупреждения
      if (firstSheet.rowCount > 1000) {
        warnings.push('Файл содержит много строк');
        recommendations.push('Рекомендуется ограничить количество обрабатываемых строк параметром maxRows');
      }

      if (headers.length > 20) {
        warnings.push('Файл содержит много колонок');
      }

      // Проверяем наличие данных в дефолтных колонках
      Object.entries(DEFAULT_COLUMN_MAPPING).forEach(([field, column]) => {
        const columnIndex = this.getColumnNumber(column);
        if (columnIndex > headers.length) {
          warnings.push(`Колонка ${column} для поля "${field}" не существует в файле`);
        }
      });

      return {
        isValid: true,
        fileInfo: {
          size: file.size,
          type: file.mimetype,
          name: file.originalname
        },
        sheets: workbook.worksheets.map(sheet => ({
          name: sheet.name,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount
        })),
        preview: {
          headers,
          sampleRows
        },
        columnMapping,
        warnings,
        recommendations
      };

    } catch (error) {
      throw new BadRequestException(`Ошибка обработки файла: ${error.message}`);
    }
  }

  private getCellValue(cell: any): any {
    if (!cell || cell.value === null || cell.value === undefined) {
      return null;
    }
    return cell.value;
  }

  private getColumnValue(sheet: any, columnLetter: string, rowNumber: number): any {
    const columnNumber = this.getColumnNumber(columnLetter);
    const cell = sheet.getRow(rowNumber).getCell(columnNumber);
    return {
      column: columnLetter,
      value: this.getCellValue(cell)
    };
  }

  private getColumnNumber(columnLetter: string): number {
    let result = 0;
    for (let i = 0; i < columnLetter.length; i++) {
      result = result * 26 + (columnLetter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode('A'.charCodeAt(0) + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }
}
