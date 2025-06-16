/**
 * @file: operations.module.ts
 * @description: Модуль для управления операциями (ОБНОВЛЕН - добавлена аналитика и ручное управление)
 * @dependencies: упрощенные сервисы, история операций, трекинг прогресса, аналитика
 * @created: 2025-01-28
 * @updated: 2025-06-11 - Добавлена аналитика и ручное управление операциями
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { Order } from '../../database/entities/order.entity';
import { Machine } from '../../database/entities/machine.entity';
import { OperationsSimpleController } from './operations-simple.controller';
import { OperationHistoryService } from './operation-history.service';
import { OperationHistoryController } from './operation-history.controller';
import { ProgressTrackingService } from './progress-tracking.service';
import { ProgressTrackingController } from './progress-tracking.controller';
import { OperationAnalyticsService } from './operation-analytics.service';
import { OperationManagementController } from './operation-management.controller';
import { OperationCompletionController } from './operation-completion.controller';
import { OperationCompletionCheckController } from './operation-completion-check.controller';
import { OperationCompletionExtendedController } from './operation-completion-extended.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operation, ShiftRecord, Order, Machine])
  ],
  controllers: [
    OperationsSimpleController,
    OperationHistoryController,
    ProgressTrackingController,
    OperationManagementController,
    OperationCompletionController,
    OperationCompletionCheckController,
    OperationCompletionExtendedController
  ],
  providers: [
    OperationHistoryService,
    ProgressTrackingService,
    OperationAnalyticsService
  ],
  exports: [
    OperationHistoryService,
    ProgressTrackingService,
    OperationAnalyticsService
  ],
})
export class OperationsModule {}
