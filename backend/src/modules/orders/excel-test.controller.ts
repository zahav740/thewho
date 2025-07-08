/**
 * @file: excel-test.controller.ts
 * @description: Простой тестовый контроллер для проверки загрузки Excel
 * @created: 2025-07-08
 */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { Express } from 'express';
import { ExcelImportService } from './excel-import.service';

@ApiTags('excel-test')
@Controller('excel-test')
export class ExcelTestController {
  private readonly logger = new Logger(ExcelTestController.name);

  constructor(
    private readonly excelImportService: ExcelImportService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Тестовая загрузка и обработка Excel файла' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const logger = new Logger('ExcelTestController');
        logger.log(`📁 Получен файл: ${file?.originalname}, тип: ${file?.mimetype}, размер: ${file?.size}`);
        
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream'
        ];
        
        const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
        
        if (isValidType) {
          logger.log('✅ Файл прошел проверку типа');
          cb(null, true);
        } else {
          logger.error(`❌ Неподдерживаемый тип файла: ${file.mimetype}`);
          cb(new BadRequestException('Только Excel файлы (.xlsx, .xls) разрешены'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      this.logger.log(`🔍 НАЧАЛО ТЕСТА: Получен файл для обработки`, {
        originalname: file?.originalname,
        size: file?.size,
        mimetype: file?.mimetype,
        hasBuffer: !!file?.buffer,
        bufferSize: file?.buffer?.length,
        bodyKeys: Object.keys(body || {})
      });

      if (!file || !file.buffer) {
        throw new BadRequestException('Файл не получен или отсутствует buffer');
      }

      // Получаем цветовые фильтры из body если есть
      let colorFilters: string[] = [];
      if (body.colorFilters) {
        try {
          colorFilters = JSON.parse(body.colorFilters);
          this.logger.log(`🎨 Применяем цветовые фильтры: ${colorFilters.join(', ')}`);
        } catch {
          this.logger.warn('Не удалось распарсить цветовые фильтры');
        }
      }

      // Запускаем реальный импорт
      this.logger.log('🚀 Запускаем импорт Excel...');
      const importResult = await this.excelImportService.importOrders(file, colorFilters);

      this.logger.log('✅ ИМПОРТ ЗАВЕРШЕН:', {
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors.length,
        totalProcessed: importResult.created + importResult.updated
      });

      return {
        success: true,
        message: `Excel файл успешно обработан!`,
        data: {
          created: importResult.created,
          updated: importResult.updated,
          totalRows: importResult.created + importResult.updated + importResult.errors.length,
          importedRows: importResult.created + importResult.updated,
          errorRows: importResult.errors.length,
          errors: importResult.errors,
          summary: `Создано: ${importResult.created}, Обновлено: ${importResult.updated}, Ошибок: ${importResult.errors.length}`
        },
        file: {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          bufferSize: file.buffer.length,
          realImport: true
        }
      };

    } catch (error) {
      this.logger.error(`❌ ОШИБКА ТЕСТА:`, error);
      return {
        success: false,
        message: `Ошибка обработки Excel: ${error.message}`,
        error: error.message,
        stack: error.stack,
        fileInfo: {
          originalname: file?.originalname || 'unknown',
          size: file?.size || 0,
          hasBuffer: !!file?.buffer
        }
      };
    }
  }

  @Post('check-file')
  @ApiOperation({ summary: 'Проверка файла без импорта' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async checkFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      this.logger.log(`🔍 ПРОВЕРКА ФАЙЛА: ${file?.originalname}`);

      if (!file) {
        throw new BadRequestException('Файл не получен');
      }

      if (!file.buffer) {
        throw new BadRequestException('Отсутствует buffer файла');
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // Пробуем загрузить Excel
      await workbook.xlsx.load(file.buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new BadRequestException('Не найден рабочий лист');
      }

      // Получаем информацию о структуре
      const sheetInfo = {
        name: worksheet.name,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        hasData: worksheet.rowCount > 1
      };

      // Читаем первые 3 строки для анализа
      const sampleData = [];
      for (let rowNum = 1; rowNum <= Math.min(3, worksheet.rowCount); rowNum++) {
        const row = worksheet.getRow(rowNum);
        const rowData: any = {};
        
        for (let colNum = 1; colNum <= Math.min(10, worksheet.columnCount); colNum++) {
          const cell = row.getCell(colNum);
          const columnLetter = String.fromCharCode(64 + colNum);
          rowData[columnLetter] = cell.value || null;
        }
        
        sampleData.push({
          rowNumber: rowNum,
          data: rowData
        });
      }

      this.logger.log('✅ ФАЙЛ УСПЕШНО ПРОВЕРЕН');

      return {
        success: true,
        message: 'Файл успешно проверен и может быть импортирован',
        fileInfo: {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          bufferSize: file.buffer.length
        },
        excelInfo: sheetInfo,
        sampleData,
        recommendation: sheetInfo.hasData ? 'Файл готов к импорту' : 'Файл пуст или содержит только заголовки'
      };

    } catch (error) {
      this.logger.error(`❌ ОШИБКА ПРОВЕРКИ ФАЙЛА:`, error);
      return {
        success: false,
        message: `Ошибка проверки файла: ${error.message}`,
        error: error.message,
        fileInfo: file ? {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          hasBuffer: !!file.buffer
        } : null
      };
    }
  }
}

