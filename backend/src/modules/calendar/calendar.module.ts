/**
 * @file: calendar.module.ts
 * @description: Модуль для производственного календаря
 * @dependencies: calendar.controller, calendar.service
 * @created: 2025-01-28
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { Machine } from '../../database/entities/machine.entity';
import { Order } from '../../database/entities/order.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { WorkingDaysService } from './working-days.service';

@Module({
  imports: [TypeOrmModule.forFeature([Operation, Machine, Order, ShiftRecord])],
  controllers: [CalendarController],
  providers: [CalendarService, WorkingDaysService],
  exports: [CalendarService, WorkingDaysService],
})
export class CalendarModule {}
