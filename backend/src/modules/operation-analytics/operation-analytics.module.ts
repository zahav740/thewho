/**
 * @file: operation-analytics.module.ts
 * @description: Модуль для аналитики операций
 * @dependencies: typeorm, entities
 * @created: 2025-06-11
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationAnalyticsController } from './operation-analytics.controller';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Machine,
      Operation,
      Order,
      ShiftRecord,
    ]),
  ],
  controllers: [OperationAnalyticsController],
})
export class OperationAnalyticsModule {}
