/**
 * @file: orders.module.ts
 * @description: Модуль для работы с заказами + файловая система + полный импорт Excel + улучшенный PDF
 * @dependencies: services, controllers
 * @created: 2025-01-28
 * @updated: 2025-07-07 // Добавлен PdfEnhancedService и контроллер
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { PdfFile } from '../../database/entities/pdf-file.entity';
import { FileHash } from '../../database/entities/file-hash.entity';
import { PdfRevision } from '../../database/entities/pdf-revision.entity';
import { OrdersController } from './orders.controller';
import { OrdersPdfFixedController } from './orders-pdf-fixed.controller';
import { PdfFixedController } from './pdf-fixed.controller';
import { OrdersService } from './orders.service';
import { OrderFileSystemService } from './order-filesystem.service';
import { OrdersFilesystemController } from './orders-filesystem.controller';
import { ExcelImportService } from './excel-import.service';
import { EnhancedExcelImportService } from './enhanced-excel-import.service';
import { ExcelPreviewService } from './excel-preview.service';
import { ExcelColumnMapperService } from './excel-column-mapper.service';
import { ExcelProductionLoaderService } from './excel-production-loader.service';
import { FlexibleExcelImportService } from './flexible-excel-import.service';
import { EnhancedOrdersController } from './enhanced-orders.controller';
import { PdfEnhancedService } from './pdf-enhanced.service';
import { PdfEnhancedController } from './pdf-enhanced.controller';
import { PdfDebugController } from './pdf-debug.controller';
import { OrdersSimpleController } from './orders-simple.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Operation, PdfFile, FileHash, PdfRevision]),
  ],
  controllers: [
    OrdersPdfFixedController,    // 🆕 ИСПРАВЛЕННЫЙ основной контроллер с PDF
    PdfFixedController,          // 🆕 ИСПРАВЛЕННЫЙ PDF контроллер
    OrdersController,            // 🔧 Старый контроллер (резерв)
    OrdersSimpleController,
    OrdersFilesystemController,  // 🆕 Файловая система
    EnhancedOrdersController,    // 🆕 Полный импорт Excel
    PdfEnhancedController,       // 🆕 Улучшенный PDF модуль
    PdfDebugController,          // 🆕 Диагностика PDF
  ],
  providers: [
    OrdersService, 
    OrderFileSystemService,      // 🆕 Файловая система
    ExcelImportService,          // Базовый импорт Excel
    EnhancedExcelImportService,  // 🆕 Полный импорт Excel с фильтрами
    ExcelPreviewService,         // 🆕 Детальный анализ Excel файлов
    ExcelColumnMapperService,    // 🆕 Анализ колонок и маппинг
    ExcelProductionLoaderService, // 🆕 Загрузка производственного плана
    FlexibleExcelImportService,   // 🆕 Гибкий импорт с пользовательским маппингом
    PdfEnhancedService,          // 🆕 Улучшенная работа с PDF
  ],
  exports: [
    OrdersService, 
    OrderFileSystemService, 
    EnhancedExcelImportService, 
    ExcelPreviewService, 
    ExcelColumnMapperService, 
    ExcelProductionLoaderService, 
    FlexibleExcelImportService,
    PdfEnhancedService,          // 🆕 Экспортируем PDF сервис
  ],
})
export class OrdersModule {}
