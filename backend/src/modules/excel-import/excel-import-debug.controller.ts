/**
 * @file: excel-import-debug.controller.ts
 * @description: Упрощенный контроллер для отладки
 * @created: 2025-07-03
 */
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExcelImportDebugService } from './excel-import-debug.service';

@ApiTags('excel-import-debug')
@Controller('excel-import-debug')
export class ExcelImportDebugController {
  private readonly logger = new Logger(ExcelImportDebugController.name);

  constructor(private readonly debugService: ExcelImportDebugService) {}

  @Get('test')
  @ApiOperation({ summary: 'Простой тест контроллера' })
  async test() {
    this.logger.log('🔍 DEBUG: test endpoint вызван');
    return { 
      status: 'ok', 
      message: 'Excel Import Debug Controller работает',
      timestamp: new Date().toISOString()
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Тест статистики' })
  async getStats() {
    this.logger.log('📊 DEBUG: stats endpoint вызван');
    return this.debugService.getStats();
  }

  @Get('files')
  @ApiOperation({ summary: 'Тест списка файлов' })
  async getFiles() {
    this.logger.log('📋 DEBUG: files endpoint вызван');
    return this.debugService.getExcelFilesList();
  }
}
