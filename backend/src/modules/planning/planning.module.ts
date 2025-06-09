/**
 * @file: planning.module.ts
 * @description: Модуль планирования производства
 * @dependencies: production-planning.service, production-planning.controller
 * @created: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionPlanningController } from './production-planning.controller';
import { ProductionPlanningExtensionsService } from './production-planning-extensions.service';
import { OperationSelectionController } from './operation-selection.controller';

// 🆕 УЛУЧШЕННОЕ ПЛАНИРОВАНИЕ
import { ProductionPlanningImprovedService } from './production-planning-improved.service';
import { ProductionPlanningImprovedController } from './production-planning-improved.controller';

@Module({
  providers: [
    ProductionPlanningService,
    ProductionPlanningExtensionsService,
    // 🆕 УЛУЧШЕННЫЙ СЕРВИС ПЛАНИРОВАНИЯ
    ProductionPlanningImprovedService
  ],
  controllers: [
    ProductionPlanningController,
    OperationSelectionController,
    // 🆕 УЛУЧШЕННЫЙ КОНТРОЛЛЕР ПЛАНИРОВАНИЯ
    ProductionPlanningImprovedController
  ],
  exports: [
    ProductionPlanningService,
    ProductionPlanningExtensionsService,
    // 🆕 ЭКСПОРТ УЛУЧШЕННОГО СЕРВИСА
    ProductionPlanningImprovedService
  ],
})
export class PlanningModule {}
