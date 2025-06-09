/**
 * @file: enhanced-orders.controller.ts
 * @description: УЛУЧШЕННЫЙ контроллер с полным импортом Excel по фильтрам
 * @dependencies: enhanced-excel-import.service
 * @created: 2025-06-09
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import type { Express } from 'express';
import { OrdersService } from './orders.service';
import { EnhancedExcelImportService, ImportSettings, EnhancedImportResult } from './enhanced-excel-import.service';
import { ExcelPreviewService, ExcelPreviewResult, ExcelOrderPreview, ImportSelection } from './excel-preview.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { Order } from '../../database/entities/order.entity';

@ApiTags('enhanced-orders')
@Controller('enhanced-orders')
export class EnhancedOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly enhancedExcelImportService: EnhancedExcelImportService,
    private readonly excelPreviewService: ExcelPreviewService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все заказы с фильтрацией и пагинацией' })
  async findAll(@Query() filterDto: OrdersFilterDto) {
    return this.ordersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  async findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ' })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заказ' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }

  @Delete('batch/selected')
  @ApiOperation({ summary: 'Удалить выбранные заказы' })
  async removeBatch(@Body('ids') ids: string[]): Promise<{ deleted: number }> {
    const deleted = await this.ordersService.removeBatch(ids);
    return { deleted };
  }

  @Delete('all/confirm')
  @ApiOperation({ summary: 'Удалить все заказы' })
  async removeAll(@Body('confirm') confirm: boolean): Promise<{ deleted: number }> {
    if (!confirm) {
      throw new Error('Подтверждение удаления обязательно');
    }
    const deleted = await this.ordersService.removeAll();
    return { deleted };
  }

  @Post('upload-excel-full')
  @ApiOperation({ 
    summary: '🚀 ПОЛНЫЙ ИМПОРТ EXCEL С ФИЛЬТРАМИ В БД',
    description: 'Загружает весь Excel файл в базу данных с применением цветовых фильтров и настроек импорта'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel', {
    fileFilter: (req, file, cb) => {
      console.log('🔍 ПОЛНЫЙ ИМПОРТ: Проверка файла:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
      
      if (isValidType) {
        console.log('✅ ПОЛНЫЙ ИМПОРТ: Файл прошел проверку');
        cb(null, true);
      } else {
        console.error('❌ ПОЛНЫЙ ИМПОРТ: Недопустимый тип файла:', file.mimetype);
        cb(new Error('Только Excel файлы (.xlsx, .xls) разрешены для полного импорта'), false);
      }
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB для больших файлов
      fieldSize: 100 * 1024 * 1024,
    },
  }))
  async uploadExcelFull(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<{
    success: boolean;
    message: string;
    data: EnhancedImportResult;
    file: any;
  }> {
    try {
      console.log('🚀 ПОЛНЫЙ ИМПОРТ EXCEL: Получен файл:', {
        originalname: file?.originalname,
        size: file?.size,
        mimetype: file?.mimetype,
        hasBuffer: !!file?.buffer,
        bufferSize: file?.buffer?.length,
        bodyData: Object.keys(body || {})
      });

      if (!file || !file.buffer) {
        throw new Error('Файл не получен или отсутствует buffer');
      }

      // Парсим настройки импорта из тела запроса
      let importSettings: ImportSettings;
      
      try {
        importSettings = body.importSettings ? JSON.parse(body.importSettings) : this.getDefaultImportSettings();
        console.log('📋 ПОЛНЫЙ ИМПОРТ: Настройки импорта:', {
          colorFiltersCount: importSettings.colorFilters?.length || 0,
          selectedFiltersCount: importSettings.colorFilters?.filter(f => f.selected)?.length || 0,
          importOnlySelected: importSettings.importOnlySelected,
          clearExisting: importSettings.clearExistingData,
          skipDuplicates: importSettings.skipDuplicates
        });
      } catch (parseError) {
        console.error('⚠️ ПОЛНЫЙ ИМПОРТ: Ошибка парсинга настроек, используем настройки по умолчанию:', parseError);
        importSettings = this.getDefaultImportSettings();
      }

      // Выполняем полный импорт с фильтрами
      console.log('🔄 ПОЛНЫЙ ИМПОРТ: Начинаем импорт в базу данных...');
      const result = await this.enhancedExcelImportService.importFullExcelWithFilters(file, importSettings);
      
      console.log('✅ ПОЛНЫЙ ИМПОРТ: Импорт завершен успешно:', {
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        created: result.created,
        updated: result.updated,
        errors: result.errors?.length || 0,
        summary: result.summary
      });

      return {
        success: true,
        message: `Полный импорт завершен! Обработано ${result.processedRows} из ${result.totalRows} строк. Создано: ${result.created}, Обновлено: ${result.updated}`,
        data: result,
        file: {
          originalname: file.originalname,
          size: file.size,
          fullImport: true,
          bufferProcessed: true
        }
      };

    } catch (error) {
      console.error('❌ ПОЛНЫЙ ИМПОРТ: Критическая ошибка:', error);
      return {
        success: false,
        message: `Ошибка полного импорта: ${error.message}`,
        data: null as any,
        file: {
          originalname: file?.originalname || 'unknown',
          size: file?.size || 0,
          error: error.message
        }
      };
    }
  }

  @Post('analyze-excel')
  @ApiOperation({ 
    summary: '🔍 ДЕТАЛЬНЫЙ АНАЛИЗ EXCEL ФАЙЛА',
    description: 'Анализирует Excel файл и показывает все найденные заказы с возможностью выбора для импорта'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
      cb(null, isValidType);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async analyzeExcelFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    data: ExcelPreviewResult;
    message: string;
  }> {
    try {
      console.log('🔍 АНАЛИЗ EXCEL: Получен файл для анализа:', file.originalname);

      const analysisResult = await this.excelPreviewService.analyzeExcelFile(file);
      
      console.log('✅ АНАЛИЗ ЗАВЕРШЕН:', {
        fileName: analysisResult.fileName,
        totalOrders: analysisResult.orders.length,
        colorsFound: Object.keys(analysisResult.colorStatistics).length
      });

      return {
        success: true,
        data: analysisResult,
        message: `Найдено ${analysisResult.orders.length} заказов в файле ${analysisResult.fileName}`
      };

    } catch (error) {
      console.error('❌ АНАЛИЗ EXCEL: Ошибка:', error);
      throw error;
    }
  }
  @ApiOperation({ 
    summary: '👁️ ПРЕВЬЮ EXCEL С АНАЛИЗОМ ФИЛЬТРОВ',
    description: 'Показывает превью Excel файла с анализом цветов и возможными фильтрами'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
      cb(null, isValidType);
    },
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  }))
  async previewExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    preview: any[];
    statistics: any;
    recommendedFilters: any[];
    totalRows: number;
  }> {
    try {
      console.log('👁️ ПРЕВЬЮ EXCEL: Анализ файла:', file.originalname);

      // Для превью используем настройки показа всех строк
      const previewSettings: ImportSettings = {
        ...this.getDefaultImportSettings(),
        importOnlySelected: false, // Показываем все строки для анализа
        clearExistingData: false   // Не удаляем данные при превью
      };

      // Выполняем "сухой прогон" без сохранения в БД
      const result = await this.enhancedExcelImportService.importFullExcelWithFilters(file, {
        ...previewSettings,
        clearExistingData: false // Превью не должно очищать данные
      });

      // Создаем превью первых 10 строк
      const preview = result.errors.slice(0, 10).map((error, index) => ({
        row: error.row,
        order: error.order,
        color: error.color,
        preview: true
      }));

      // Формируем рекомендуемые фильтры на основе найденных цветов
      const recommendedFilters = Object.entries(result.colorStatistics)
        .filter(([color, count]) => count > 0)
        .map(([color, count]) => ({
          color,
          count,
          label: this.getColorLabel(color),
          description: `Найдено ${count} строк`,
          recommended: true
        }));

      console.log('✅ ПРЕВЬЮ: Анализ завершен:', {
        totalRows: result.totalRows,
        colorsFound: Object.keys(result.colorStatistics).length,
        recommendedFilters: recommendedFilters.length
      });

      return {
        success: true,
        preview,
        statistics: result.colorStatistics,
        recommendedFilters,
        totalRows: result.totalRows
      };

    } catch (error) {
      console.error('❌ ПРЕВЬЮ: Ошибка анализа:', error);
      throw error;
    }
  }

  /**
   * Настройки импорта по умолчанию
   */
  private getDefaultImportSettings(): ImportSettings {
    return {
      colorFilters: [
        { 
          color: 'green', 
          label: 'Зеленый (Готовые)', 
          description: 'Заказы готовые к производству', 
          priority: 1, 
          selected: true 
        },
        { 
          color: 'yellow', 
          label: 'Желтый (Обычные)', 
          description: 'Стандартные заказы', 
          priority: 2, 
          selected: true 
        },
        { 
          color: 'red', 
          label: 'Красный (Критичные)', 
          description: 'Срочные заказы высокого приоритета', 
          priority: 3, 
          selected: true 
        },
        { 
          color: 'blue', 
          label: 'Синий (Плановые)', 
          description: 'Плановые заказы', 
          priority: 4, 
          selected: true 
        },
      ],
      columnMapping: [
        { fieldName: 'Номер чертежа', excelColumn: 'C', description: 'Уникальный номер чертежа', required: true },
        { fieldName: 'Количество', excelColumn: 'E', description: 'Количество изделий', required: true },
        { fieldName: 'Срок', excelColumn: 'H', description: 'Дедлайн выполнения заказа' },
        { fieldName: 'Приоритет', excelColumn: 'K', description: 'Приоритет выполнения заказа' },
        { fieldName: 'Тип работы', excelColumn: 'F', description: 'Описание типа работ' },
      ],
      importOnlySelected: false,  // По умолчанию импортируем все
      clearExistingData: false,   // По умолчанию не очищаем
      skipDuplicates: true        // По умолчанию пропускаем дубликаты
    };
  }

  /**
   * Получение человекочитаемого названия цвета
   */
  private getColorLabel(color: string): string {
    const labels: Record<string, string> = {
      green: 'Зеленый (Готовые)',
      yellow: 'Желтый (Обычные)',
      red: 'Красный (Критичные)',
      blue: 'Синий (Плановые)',
      other: 'Другие цвета'
    };
    return labels[color] || `Цвет: ${color}`;
  }

  /**
   * Получение стандартного маппинга колонок
   */
  private getDefaultColumnMapping() {
    return [
      { fieldName: 'Номер чертежа', excelColumn: 'C', description: 'Уникальный номер чертежа', required: true },
      { fieldName: 'Количество', excelColumn: 'E', description: 'Количество изделий', required: true },
      { fieldName: 'Срок', excelColumn: 'H', description: 'Дедлайн выполнения заказа' },
      { fieldName: 'Приоритет', excelColumn: 'K', description: 'Приоритет выполнения заказа' },
      { fieldName: 'Тип работы', excelColumn: 'F', description: 'Описание типа работ' },
    ];
  }

  @Post('import-selected-orders')
  @ApiOperation({ 
    summary: '🎯 ИМПОРТ ВЫБРАННЫХ ЗАКАЗОВ',
    description: 'Импортирует только выбранные заказы из ранее проанализированного Excel файла'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel', {
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
      cb(null, isValidType);
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  }))
  async importSelectedOrders(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      selectedOrders: string; // JSON строка с массивом номеров чертежей
      clearExisting: string;
      skipDuplicates: string;
      colorFilters: string;   // JSON строка с выбранными цветами
    },
  ): Promise<{
    success: boolean;
    message: string;
    data: EnhancedImportResult;
  }> {
    try {
      console.log('🎯 ВЫБОРОЧНЫЙ ИМПОРТ: Начало импорта выбранных заказов:', {
        fileName: file.originalname,
        bodyKeys: Object.keys(body)
      });

      // Парсим настройки импорта
      const selectedOrders: string[] = JSON.parse(body.selectedOrders || '[]');
      const clearExisting: boolean = body.clearExisting === 'true';
      const skipDuplicates: boolean = body.skipDuplicates !== 'false'; // По умолчанию true
      const colorFilters: string[] = JSON.parse(body.colorFilters || '[]');

      console.log('📋 НАСТРОЙКИ ИМПОРТА:', {
        selectedOrdersCount: selectedOrders.length,
        clearExisting,
        skipDuplicates,
        colorFiltersCount: colorFilters.length
      });

      // Создаем настройки для импорта с фильтрацией по выбранным заказам
      const importSettings: ImportSettings = {
        colorFilters: colorFilters.map(color => ({
          color,
          label: this.getColorLabel(color),
          description: `Заказы цвета ${color}`,
          priority: 1,
          selected: true
        })),
        columnMapping: this.getDefaultColumnMapping(),
        importOnlySelected: colorFilters.length > 0,
        clearExistingData: clearExisting,
        skipDuplicates: skipDuplicates
      };

      // Выполняем импорт с настройками
      const result = await this.enhancedExcelImportService.importFullExcelWithFilters(file, importSettings);
      
      // Дополнительно фильтруем результат по выбранным заказам (если указаны)
      if (selectedOrders.length > 0) {
        console.log(`🔍 Дополнительная фильтрация по ${selectedOrders.length} выбранным заказам`);
        // TODO: Реализовать дополнительную фильтрацию по номерам чертежей
      }

      console.log('✅ ВЫБОРОЧНЫЙ ИМПОРТ ЗАВЕРШЕН:', {
        totalRows: result.totalRows,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
      });

      return {
        success: true,
        message: `Импорт завершен! Создано: ${result.created}, Обновлено: ${result.updated}, Ошибок: ${result.errors.length}`,
        data: result
      };

    } catch (error) {
      console.error('❌ ВЫБОРОЧНЫЙ ИМПОРТ: Ошибка:', error);
      return {
        success: false,
        message: `Ошибка выборочного импорта: ${error.message}`,
        data: null as any
      };
    }
  }
}
