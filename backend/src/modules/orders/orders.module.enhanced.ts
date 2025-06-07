/**
 * @file: orders.module.ts
 * @description: Модуль для работы с заказами + файловая система
 * @dependencies: services, controllers
 * @created: 2025-01-28
 * @updated: 2025-06-07 // Добавлен OrderFileSystemService
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { PdfFile } from '../../database/entities/pdf-file.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderFileSystemService } from './order-filesystem.service';
import { ExcelImportService } from './excel-import.service';
// import { ExcelImportEnhancedService } from './excel-import-enhanced.service';
import { OrdersSimpleController } from './orders-simple.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Operation, PdfFile]),
  ],
  controllers: [OrdersController, OrdersSimpleController],
  providers: [
    OrdersService, 
    OrderFileSystemService,  // 🆕 Новый сервис файловой системы
    ExcelImportService, 
    // ExcelImportEnhancedService,
  ],
  exports: [OrdersService, OrderFileSystemService], // Экспортируем оба сервиса
})
export class OrdersModule {}
