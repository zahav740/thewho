/**
 * @file: operations.module.ts
 * @description: Модуль для управления операциями (ОБНОВЛЕН - добавлена история операций)
 * @dependencies: упрощенные сервисы, история операций
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Добавлена история операций
 */
import { Module } from '@nestjs/common';
import { OperationsSimpleController } from './operations-simple.controller';
import { OperationHistoryService } from './operation-history.service';
import { OperationHistoryController } from './operation-history.controller';

@Module({
  imports: [],
  controllers: [
    OperationsSimpleController,
    OperationHistoryController
  ],
  providers: [
    OperationHistoryService
  ],
  exports: [
    OperationHistoryService
  ],
})
export class OperationsModule {}
