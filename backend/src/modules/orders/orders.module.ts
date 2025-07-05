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
// Excel Import Entities
import { ExcelImport } from '../../database/entities/excel/excel-import.entity';
import { ExcelData } from '../../database/entities/excel/excel-data.entity';
import { ImportFilter } from '../../database/entities/excel/import-filter.entity';
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
// New Excel Import DB Service
import { ExcelImportDbService } from './excel-import-db.service';
import { ExcelImportDbController } from './excel-import-db.controller'; // ✅ Включен для работы с Excel импортом
// import { ExcelImportTestController } from './excel-import-test.controller'; // Тестовая версия
import { ExcelImportSimpleController } from './excel-import-simple.controller'; // Упрощенная версия

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, 
      Operation, 
      PdfFile, 
      FileHash, 
      PdfRevision,
      // Excel Import Entities
      ExcelImport,
      ExcelData,
      ImportFilter
    ]),
  ],
  controllers: [
    OrdersController, 
    OrdersSimpleController,
    OrdersFilesystemController,  // 🆕 Файловая система
    EnhancedOrdersController,    // 🆕 Полный импорт Excel
    ExcelImportDbController,   // 🆕 Excel импорт с сохранением в БД ✅ ВКЛЮЧЕН
    // ExcelImportTestController, // 🧪 Тестовая версия Excel контроллера
    ExcelImportSimpleController, // 🔧 Упрощенная версия Excel контроллера
  ],
  providers: [
    OrdersService, 
    OrderFileSystemService,      // 🆕 Файловая система
    ExcelImportService,          // Базовый импорт Excel
    EnhancedExcelImportService,  // 🆕 Полный импорт Excel с фильтрами
    ExcelPreviewService,         // 🆕 Детальный анализ Excel файлов
    ExcelColumnMapperService,    // 🆕 Анализ колонок и маппинг
    ExcelImportDbService,        // 🆕 Excel импорт с сохранением в БД
    // ExcelImportEnhancedService,
  ],
  exports: [
    OrdersService, 
    OrderFileSystemService, 
    EnhancedExcelImportService, 
    ExcelPreviewService, 
    ExcelColumnMapperService,
    ExcelImportDbService, // 🆕 Экспортируем новый сервис
  ], // Экспортируем все сервисы
})
export class OrdersModule {}
