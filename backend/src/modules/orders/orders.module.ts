/**
 * @file: orders.module.ts
 * @description: Модуль для работы с заказами (исправлен для PdfFile)
 * @dependencies: services, controllers
 * @created: 2025-01-28
 * @fixed: 2025-06-01 // Добавлена сущность PdfFile в импорты
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { PdfFile } from '../../database/entities/pdf-file.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
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
    ExcelImportService, 
    // ExcelImportEnhancedService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
