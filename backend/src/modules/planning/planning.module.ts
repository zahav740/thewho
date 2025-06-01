/**
 * @file: planning.module.ts
 * @description: Модуль планирования производства
 * @dependencies: production-planning.service, production-planning.controller
 * @created: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionPlanningController } from './production-planning.controller';

@Module({
  providers: [ProductionPlanningService],
  controllers: [ProductionPlanningController],
  exports: [ProductionPlanningService],
})
export class PlanningModule {}
