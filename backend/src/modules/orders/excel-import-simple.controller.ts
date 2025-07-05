/**
 * @file: excel-import-simple.controller.ts
 * @description: Упрощенный контроллер для Excel импорта (без сложных зависимостей)
 * @created: 2025-06-30
 */
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Query,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { MulterFile } from '../../types/express';

@ApiTags('excel-import-db')
@Controller('excel-import-db')
export class ExcelImportSimpleController {
  private readonly logger = new Logger(ExcelImportSimpleController.name);

  constructor() {
    this.logger.log('🚀 ExcelImportSimpleController инициализирован (упрощенная версия)');
  }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint' })
  test() {
    return {
      status: 'success',
      message: 'Excel Import Simple Controller is working!',
      timestamp: new Date().toISOString(),
      version: 'simple',
    };
  }

  @Get('filters')
  @ApiOperation({ summary: 'Получить фильтры импорта' })
  getFilters(@Query('targetTable') targetTable?: string) {
    this.logger.log(`📋 Получение фильтров для таблицы: ${targetTable || 'all'}`);
    
    const filters = [
      {
        id: 1,
        name: 'Orders Import Filter',
        description: 'Фильтр для импорта заказов из Excel файлов',
        target_table: 'orders',
        is_active: true,
        filter_config: {
          required_columns: ['drawing_number', 'quantity', 'deadline'],
          optional_columns: ['priority', 'workType'],
        },
        column_mapping: {
          'Номер чертежа': 'drawing_number',
          'Количество': 'quantity',
          'Срок': 'deadline',
          'Приоритет': 'priority',
          'Тип работы': 'workType'
        }
      },
      {
        id: 2,
        name: 'Operations Import Filter',
        description: 'Фильтр для импорта операций из Excel файлов',
        target_table: 'operations',
        is_active: true,
        filter_config: {
          required_columns: ['order_id', 'operation_name', 'planned_duration'],
          optional_columns: ['machine_id', 'operator_id'],
        },
        column_mapping: {
          'ID заказа': 'order_id',
          'Название операции': 'operation_name',
          'Плановая длительность': 'planned_duration',
        }
      }
    ];

    if (targetTable) {
      return filters.filter(f => f.target_table === targetTable);
    }

    return filters;
  }

  @Get('imports')
  @ApiOperation({ summary: 'Получить список импортов' })
  getImports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`📄 Получение списка импортов: page=${page}, limit=${limit}`);
    
    // Пока возвращаем пустой список, в будущем добавим реальные данные из БД
    return {
      imports: [],
      total: 0,
      page: Number(page),
      totalPages: 0,
      message: 'Пока нет импортированных файлов. Загрузите Excel файл для начала.'
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить Excel файл' })
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
    this.logger.log(`📤 Получен файл для загрузки: ${file?.originalname || 'unknown'}`);
    this.logger.log(`🎯 Целевая таблица: ${targetTable}`);
    this.logger.log(`⚙️ ID фильтра: ${filterId || 'не указан'}`);

    if (!file) {
      return {
        status: 'error',
        message: 'Файл не был загружен'
      };
    }

    // Имитируем обработку файла
    const mockResult = {
      id: Math.floor(Math.random() * 1000),
      filename: file.originalname,
      status: 'processed',
      created: Math.floor(Math.random() * 50),
      updated: Math.floor(Math.random() * 10),
      skipped: Math.floor(Math.random() * 5),
      errors: [],
      headers: ['drawing_number', 'quantity', 'deadline', 'priority'],
      rowsCount: Math.floor(Math.random() * 100) + 10,
      dataPreview: [
        { drawing_number: 'TEST-001', quantity: 5, deadline: '2025-07-01' },
        { drawing_number: 'TEST-002', quantity: 3, deadline: '2025-07-02' },
      ],
      message: 'Файл успешно обработан (упрощенная версия)',
      note: 'Это упрощенная версия. Файл не сохраняется в БД, но API работает.',
      targetTable,
      filterId,
      fileInfo: {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    };

    this.logger.log(`✅ Файл "${file.originalname}" успешно "обработан" (тестовая версия)`);

    return mockResult;
  }

  @Get('imports/:id')
  @ApiOperation({ summary: 'Получить детали импорта' })
  getImportDetails(@Query('id') id: number) {
    this.logger.log(`🔍 Получение деталей импорта ID: ${id}`);
    
    return {
      import: {
        id: Number(id),
        filename: `test-file-${id}.xlsx`,
        original_filename: `test-file-${id}.xlsx`,
        upload_date: new Date().toISOString(),
        status: 'processed',
        rows_count: 42,
        headers_count: 4
      },
      dataPreview: [
        { column_name: 'drawing_number', cell_value: 'TEST-001', row_number: 2 },
        { column_name: 'quantity', cell_value: '5', row_number: 2 },
        { column_name: 'deadline', cell_value: '2025-07-01', row_number: 2 },
      ],
      message: 'Это тестовые данные (упрощенная версия)'
    };
  }
}
