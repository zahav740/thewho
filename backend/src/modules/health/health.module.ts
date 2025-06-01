/**
 * @file: health.module.ts
 * @description: Модуль для проверки здоровья приложения
 * @dependencies: health.controller
 * @created: 2025-05-27
 */
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
