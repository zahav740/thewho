/**
 * @file: excel-import-test.controller.ts
 * @description: Простой тестовый контроллер для Excel импорта (без зависимостей)
 * @created: 2025-06-30
 */
import { Controller, Get, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('excel-import-db')
@Controller('excel-import-db')
export class ExcelImportTestController {
  private readonly logger = new Logger(ExcelImportTestController.name);

  constructor() {
    this.logger.log('🧪 ExcelImportTestController инициализирован (тестовая версия)');
  }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint для проверки работы контроллера' })
  test() {
    this.logger.log('🔧 Тестовый endpoint вызван');
    return {
      status: 'success',
      message: 'Excel Import DB controller is working!',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET /api/excel-import-db/test',
        'GET /api/excel-import-db/filters',
        'GET /api/excel-import-db/imports',
        'POST /api/excel-import-db/upload'
      ]
    };
  }

  @Get('filters')
  @ApiOperation({ summary: 'Получить фильтры импорта (тестовая версия)' })
  getFilters() {
    this.logger.log('📋 Получение тестовых фильтров');
    return [
      {
        id: 1,
        name: 'Orders Import Filter (Test)',
        description: 'Тестовый фильтр для импорта заказов',
        target_table: 'orders',
        is_active: true
      },
      {
        id: 2,
        name: 'Operations Import Filter (Test)',
        description: 'Тестовый фильтр для импорта операций',
        target_table: 'operations',
        is_active: true
      }
    ];
  }

  @Get('imports')
  @ApiOperation({ summary: 'Получить список импортов (тестовая версия)' })
  getImports() {
    this.logger.log('📄 Получение тестового списка импортов');
    return {
      imports: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузка файла (тестовая версия)' })
  uploadFile() {
    this.logger.log('📤 Тестовая загрузка файла');
    return {
      status: 'error',
      message: 'Это тестовая версия. Полная функциональность будет добавлена позже.',
      test: true
    };
  }
}
