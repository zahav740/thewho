/**
 * @file: excel-import-db.controller.ts
 * @description: Контроллер для импорта Excel с сохранением в базу данных
 * @created: 2025-06-30
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Body,
  Put,
  Delete,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ExcelImportDbService } from './excel-import-db.service';
import { MulterFile } from '../../types/express';

@ApiTags('excel-import-db')
@Controller('excel-import-db')
export class ExcelImportDbController {
  private readonly logger = new Logger(ExcelImportDbController.name);

  constructor(private readonly excelImportDbService: ExcelImportDbService) {
    this.logger.log('🚀 ExcelImportDbController инициализирован');
    this.logger.log('📋 Доступные маршруты:');
    this.logger.log('  POST /api/excel-import-db/upload');
    this.logger.log('  GET  /api/excel-import-db/imports');
    this.logger.log('  GET  /api/excel-import-db/database-schema/:table');
    this.logger.log('  POST /api/excel-import-db/analyze-excel');
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить и импортировать Excel файл в базу данных' })
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
  async uploadExcel(
    @UploadedFile() file: MulterFile,
    @Query('targetTable') targetTable: string = 'orders',
    @Query('filterId') filterId?: number,
  ) {
    this.logger.log(`📤 Загрузка Excel файла: ${file?.originalname || 'unknown'}, targetTable: ${targetTable}`);
    try {
      const result = await this.excelImportDbService.importExcelFile(
        file,
        targetTable,
        filterId,
      );
      this.logger.log(`✅ Excel файл успешно импортирован: ${file?.originalname}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Ошибка импорта Excel файла: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('imports')
  @ApiOperation({ summary: 'Получить список всех импортов' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getImportsList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`📄 Получение списка импортов: page=${page}, limit=${limit}`);
    return await this.excelImportDbService.getImportsList(page, limit);
  }

  @Get('imports/:id')
  @ApiOperation({ summary: 'Получить детали конкретного импорта' })
  async getImportDetails(@Param('id', ParseIntPipe) id: number) {
    return await this.excelImportDbService.getImportDetails(id);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Получить доступные фильтры импорта' })
  @ApiQuery({ name: 'targetTable', required: false })
  async getImportFilters(@Query('targetTable') targetTable?: string) {
    this.logger.log(`⚙️ Получение фильтров для таблицы: ${targetTable || 'all'}`);
    return await this.excelImportDbService.getImportFilters(targetTable);
  }

  @Post('filters')
  @ApiOperation({ summary: 'Создать новый фильтр импорта' })
  async createImportFilter(@Body() filterData: any) {
    // Здесь нужно будет создать DTO для валидации
    return await this.excelImportDbService.createImportFilter(filterData);
  }

  @Put('filters/:id')
  @ApiOperation({ summary: 'Обновить фильтр импорта' })
  async updateImportFilter(
    @Param('id', ParseIntPipe) id: number,
    @Body() filterData: any
  ) {
    return await this.excelImportDbService.updateImportFilter(id, filterData);
  }

  @Delete('filters/:id')
  @ApiOperation({ summary: 'Удалить фильтр импорта' })
  async deleteImportFilter(@Param('id', ParseIntPipe) id: number) {
    return await this.excelImportDbService.deleteImportFilter(id);
  }

  @Post('imports/:id/re-import')
  @ApiOperation({ summary: 'Повторный импорт с другими настройками' })
  async reImportExcel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { targetTable: string; filterId?: number },
  ) {
    return await this.excelImportDbService.reImportExcel(
      id,
      body.targetTable,
      body.filterId,
    );
  }

  @Get('database-schema/:table')
  @ApiOperation({ summary: 'Получить схему таблицы базы данных' })
  async getDatabaseSchema(@Param('table') tableName: string) {
    this.logger.log(`📋 Получение схемы таблицы: ${tableName}`);
    return await this.excelImportDbService.getDatabaseSchema(tableName);
  }

  @Post('analyze-excel')
  @ApiOperation({ summary: 'Анализировать Excel файл без импорта' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeExcel(@UploadedFile() file: MulterFile) {
    this.logger.log(`🔍 Анализ Excel файла: ${file?.originalname}`);
    return await this.excelImportDbService.analyzeExcelStructure(file);
  }
}
