/**
 * @file: analytics.module.ts
 * @description: Модуль аналитики KPI и OEE
 * @created: 2025-06-30
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { Machine } from '../../database/entities/machine.entity';
import { Operator } from '../../database/entities/operator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftRecord, Machine, Operator])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
