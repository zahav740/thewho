/**
 * @file: shifts.module.ts
 * @description: Модуль для управления сменами (ИСПРАВЛЕНО - без EventEmitter)
 * @dependencies: TypeORM, ShiftRecord entity, ShiftsService
 * @created: 2025-01-28
 * @updated: 2025-06-16 - Убран EventEmitter для совместимости
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { EventEmitterModule } from '@nestjs/event-emitter'; // Пакет не установлен
import { ShiftsController } from './shifts.controller';
import { ShiftsSimpleController } from './shifts-simple.controller';
import { ShiftsService } from './shifts.service';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftRecord]),
    // EventEmitterModule.forRoot(), // 🆕 Для отправки событий синхронизации (ОТКЛЮЧЕНО)
  ],
  controllers: [ShiftsController, ShiftsSimpleController], // Оба контроллера
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
