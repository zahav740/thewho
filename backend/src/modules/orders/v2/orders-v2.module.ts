/**
 * @file: orders-v2.module.ts
 * @description: Модуль для улучшенной версии заказов V2
 * @dependencies: nestjs, typeorm
 * @created: 2025-07-03
 * @fixed: 2025-07-04 - упрощены зависимости
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
    TypeOrmModule.forFeature([
      Order, 
      Operation
    ]),
  ],
  controllers: [OrdersV2Controller],
  providers: [
    OrdersV2Service,
    PriorityCalculatorService,
    ExcelParserService,
  ],
  exports: [
    OrdersV2Service,
    PriorityCalculatorService,
    ExcelParserService,
  ],
})
export class OrdersV2Module {}
