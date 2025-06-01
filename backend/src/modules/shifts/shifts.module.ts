/**
 * @file: shifts.module.ts
 * @description: Модуль для управления сменами (упрощенный)
 * @dependencies: упрощенные сервисы
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { ShiftsSimpleController } from './shifts-simple.controller';

@Module({
  imports: [],
  controllers: [ShiftsSimpleController],
  providers: [],
  exports: [],
})
export class ShiftsModule {}
