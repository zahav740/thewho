/**
 * @file: orders.module.ts
 * @description: Модуль для работы с заказами + файловая система + полный импорт Excel
 * @dependencies: services, controllers
 * @created: 2025-01-28
 * @updated: 2025-06-09 // Добавлен EnhancedExcelImportService
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { PdfFile } from '../../database/entities/pdf-file.entity';
import { FileHash } from '../../database/entities/file-hash.entity';
import { PdfRevision } from '../../database/entities/pdf-revision.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderFileSystemService } from './order-filesystem.service';
import { OrdersFilesystemController } from './orders-filesystem.controller';
import { ExcelImportService } from './excel-import.service';
import { EnhancedExcelImportService } from './enhanced-excel-import.service';
import { ExcelPreviewService } from './excel-preview.service';
import { ExcelColumnMapperService } from './excel-column-mapper.service';
import { EnhancedOrdersController } from './enhanced-orders.controller';
// import { ExcelImportEnhancedService } from './excel-import-enhanced.service';
import { OrdersSimpleController } from './orders-simple.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Operation, PdfFile, FileHash, PdfRevision]),
  ],
  controllers: [
    OrdersController, 
    OrdersSimpleController,
    OrdersFilesystemController,  // 🆕 Файловая система
    EnhancedOrdersController,    // 🆕 Полный импорт Excel
  ],
  providers: [
    OrdersService, 
    OrderFileSystemService,      // 🆕 Файловая система
    ExcelImportService,          // Базовый импорт Excel
    EnhancedExcelImportService,  // 🆕 Полный импорт Excel с фильтрами
    ExcelPreviewService,         // 🆕 Детальный анализ Excel файлов
    ExcelColumnMapperService,    // 🆕 Анализ колонок и маппинг
    // ExcelImportEnhancedService,
  ],
  exports: [OrdersService, OrderFileSystemService, EnhancedExcelImportService, ExcelPreviewService, ExcelColumnMapperService], // Экспортируем все сервисы
})
export class OrdersModule {}
