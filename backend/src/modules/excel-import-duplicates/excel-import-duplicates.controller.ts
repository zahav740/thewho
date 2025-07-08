/**
 * @file: excel-import-duplicates.controller.ts
 * @description: Контроллер для импорта Excel с проверкой дубликатов
 * @created: 2025-07-08
 */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { 
  ExcelImportWithDuplicatesService, 
  BatchDuplicateResolution, 
  ImportResultWithDuplicates 
} from '../orders/excel-import-with-duplicates.service';
import type { Express } from 'express';

@ApiTags('excel-import-duplicates')
@Controller('excel-import-duplicates')
export class ExcelImportDuplicatesController {
  private readonly logger = new Logger(ExcelImportDuplicatesController.name);
  private fileCache = new Map<string, Express.Multer.File>();

  constructor(
    private readonly excelImportWithDuplicatesService: ExcelImportWithDuplicatesService
  ) {
    this.logger.log('🚀 ExcelImportDuplicatesController инициализирован');
    this.logger.log('📋 Доступные маршруты:');
    this.logger.log('  POST /api/excel-import-duplicates/analyze');
    this.logger.log('  POST /api/excel-import-duplicates/process-with-resolutions');
    this.logger.log('  POST /api/excel-import-duplicates/import-auto');
  }

  @Post('analyze')
  @ApiOperation({ 
    summary: 'Анализировать Excel файл на дубликаты (шаг 1)', 
    description: 'Загружает файл, анализирует его содержимое и возвращает список найденных дубликатов для принятия решения пользователем'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || 
                         file.originalname.match(/\.(xlsx?|csv)$/);
      
      if (isValidType) {
        cb(null, true);
      } else {
        cb(new Error('Только Excel файлы (.xlsx, .xls) разрешены'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async analyzeForDuplicates(
    @UploadedFile() file: Express.Multer.File,
    @Body('colorFilters') colorFilters?: string[]
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log(`🔍 Анализ Excel файла на дубликаты: ${file?.originalname}`);
    
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    try {
      // Сохраняем файл в кеш для последующего использования
      const fileId = this.generateFileId(file);
      this.fileCache.set(fileId, file);
      
      // Очищаем старые файлы из кеша (старше 1 часа)
      this.cleanupOldFiles();

      const result = await this.excelImportWithDuplicatesService.analyzeExcelForDuplicates(
        file,
        colorFilters || []
      );

      // Добавляем ID файла к результату для последующего использования
      (result as any).fileId = fileId;

      this.logger.log(`✅ Анализ завершен: найдено ${result.duplicatesFound.length} дубликатов`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Ошибка анализа файла: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('process-with-resolutions')
  @ApiOperation({ 
    summary: 'Обработать файл с решениями по дубликатам (шаг 2)', 
    description: 'Применяет решения пользователя по каждому найденному дубликату и выполняет импорт'
  })
  async processWithResolutions(
    @Body() body: {
      fileId: string;
      resolutions: BatchDuplicateResolution;
      colorFilters?: string[];
    }
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log(`⚙️ Обработка решений по дубликатам для файла: ${body.fileId}`);
    
    if (!body.fileId) {
      throw new BadRequestException('ID файла не предоставлен');
    }

    const file = this.fileCache.get(body.fileId);
    if (!file) {
      throw new BadRequestException('Файл не найден в кеше. Пожалуйста, повторите анализ');
    }

    try {
      const result = await this.excelImportWithDuplicatesService.processDuplicateResolutions(
        file,
        body.resolutions,
        body.colorFilters || []
      );

      // Удаляем файл из кеша после обработки
      this.fileCache.delete(body.fileId);

      this.logger.log(`✅ Обработка завершена: создано ${result.created}, обновлено ${result.updated}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки решений: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('import-auto')
  @ApiOperation({ 
    summary: 'Автоматический импорт с заданным действием для дубликатов', 
    description: 'Импортирует файл с автоматической обработкой дубликатов (заменить все или пропустить все)'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || 
                         file.originalname.match(/\.(xlsx?|csv)$/);
      
      if (isValidType) {
        cb(null, true);
      } else {
        cb(new Error('Только Excel файлы (.xlsx, .xls) разрешены'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async importWithAutoResolve(
    @UploadedFile() file: Express.Multer.File,
    @Body('autoAction') autoAction: 'replace' | 'skip' = 'skip',
    @Body('colorFilters') colorFilters?: string[]
  ): Promise<ImportResultWithDuplicates> {
    this.logger.log(`🚀 Автоматический импорт с действием "${autoAction}": ${file?.originalname}`);
    
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    try {
      const result = await this.excelImportWithDuplicatesService.importOrdersWithAutoResolve(
        file,
        autoAction,
        colorFilters || []
      );

      this.logger.log(`✅ Автоматический импорт завершен: создано ${result.created}, обновлено ${result.updated}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Ошибка автоматического импорта: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Генерирует уникальный ID для файла
   */
  private generateFileId(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const fileName = file.originalname;
    const fileSize = file.size;
    return `${timestamp}_${fileName}_${fileSize}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  /**
   * Очищает старые файлы из кеша
   */
  private cleanupOldFiles(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [fileId] of this.fileCache) {
      const timestamp = parseInt(fileId.split('_')[0]);
      if (timestamp < oneHourAgo) {
        this.fileCache.delete(fileId);
        this.logger.log(`🧹 Удален старый файл из кеша: ${fileId}`);
      }
    }
  }
}
