/**
 * @file: orders-v2.module.simplified.ts
 * @description: Упрощенный модуль V2 без сложных зависимостей
 * @dependencies: nestjs, typeorm
 * @created: 2025-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersV2Controller } from './orders-v2.controller';
import { OrdersV2Service } from './orders-v2.service';
import { PriorityCalculatorService } from './priority-calculator.service';
import { ExcelParserService } from './excel-parser.service';
import { Order } from '../../../database/entities/order.entity';
import { Operation } from '../../../database/entities/operation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Operation]),
  ],
  controllers: [OrdersV2Controller],
  providers: [
    PriorityCalculatorService,
    ExcelParserService,
    // Упрощенная версия без OrdersService
    {
      provide: OrdersV2Service,
      useClass: OrdersV2Service,
    },
  ],
  exports: [
    OrdersV2Service,
    PriorityCalculatorService,
    ExcelParserService,
  ],
})
export class OrdersV2ModuleSimplified {}
