/**
 * @file: excel-upload-test.controller.ts
 * @description: Контроллер для тестирования загрузки Excel с правильными endpoint'ами
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
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import type { Express } from 'express';
import { ExcelImportService } from './excel-import.service';

@ApiTags('excel-upload-test')
@Controller('orders')
export class ExcelUploadTestController {
  private readonly logger = new Logger(ExcelUploadTestController.name);

  constructor(
    private readonly excelImportService: ExcelImportService,
  ) {}

  @Post('upload-excel')
  @ApiOperation({ summary: 'Загрузка Excel файла (основной endpoint для фронтенда)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат импорта Excel' })
  @UseInterceptors(
    FileInterceptor('excel', {
      fileFilter: (req, file, cb) => {
        const logger = new Logger('ExcelUploadTestController');
        logger.log(`📁 [UPLOAD-EXCEL] Получен файл: ${file?.originalname}, размер: ${file?.size}`);
        
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream'
        ];
        
        const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
        
        if (isValidType) {
          logger.log('✅ [UPLOAD-EXCEL] Файл прошел проверку типа');
          cb(null, true);
        } else {
          logger.error(`❌ [UPLOAD-EXCEL] Неподдерживаемый тип файла: ${file.mimetype}`);
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
      this.logger.log(`🚀 [UPLOAD-EXCEL] Начало обработки`, {
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
          this.logger.log(`🎨 [UPLOAD-EXCEL] Применяем цветовые фильтры: ${colorFilters.join(', ')}`);
        } catch {
          this.logger.warn('[UPLOAD-EXCEL] Не удалось распарсить цветовые фильтры');
        }
      }

      // Запускаем реальный импорт через ExcelImportService
      this.logger.log('📊 [UPLOAD-EXCEL] Запускаем ExcelImportService...');
      const importResult = await this.excelImportService.importOrders(file, colorFilters);

      this.logger.log('✅ [UPLOAD-EXCEL] Импорт завершен:', {
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors.length,
        totalProcessed: importResult.created + importResult.updated
      });

      // Возвращаем результат в формате, который ожидает фронтенд
      return {
        success: true,
        message: 'Excel файл успешно обработан',
        data: {
          created: importResult.created,
          updated: importResult.updated,
          totalRows: importResult.created + importResult.updated + importResult.errors.length,
          importedRows: importResult.created + importResult.updated,
          skippedRows: importResult.errors.length,
          errors: importResult.errors,
        },
        file: {
          originalname: file.originalname,
          size: file.size,
          realFile: true,
        },
      };

    } catch (error) {
      this.logger.error(`❌ [UPLOAD-EXCEL] Ошибка:`, error);
      
      return {
        success: false,
        message: `Ошибка обработки Excel файла: ${error.message}`,
        error: error.message,
        file: {
          originalname: file?.originalname || 'unknown',
          size: file?.size || 0,
          hasBuffer: !!file?.buffer
        }
      };
    }
  }
}

