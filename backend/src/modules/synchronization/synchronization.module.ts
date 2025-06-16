/**
 * @file: synchronization.module.ts
 * @description: Модуль синхронизации между Production и Shifts (упрощенная версия)
 * @dependencies: TypeORM
 * @created: 2025-06-15
 * @updated: 2025-06-16 - Убран EventEmitter для совместимости
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SynchronizationService } from './synchronization.service';
import { SynchronizationController } from './synchronization.controller';
import { Operation } from '../../database/entities/operation.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { Machine } from '../../database/entities/machine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation, ShiftRecord, Machine]),
    // EventEmitterModule.forRoot(), // Убрано - пакет не установлен
  ],
  controllers: [SynchronizationController],
  providers: [SynchronizationService],
  exports: [SynchronizationService], // Экспортируем для использования в других модулях
})
export class SynchronizationModule {}
