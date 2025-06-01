/**
 * @file: operations.module.ts
 * @description: Модуль для управления операциями (упрощенный)
 * @dependencies: упрощенные сервисы
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { OperationsSimpleController } from './operations-simple.controller';

@Module({
  imports: [],
  controllers: [OperationsSimpleController],
  providers: [],
  exports: [],
})
export class OperationsModule {}
