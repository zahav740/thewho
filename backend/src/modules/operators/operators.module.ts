/**
 * @file: operators.module.ts
 * @description: Модуль для операторов
 * @dependencies: OperatorsController
 * @created: 2025-06-09
 */
import { Module } from '@nestjs/common';
import { OperatorsController } from './operators.controller';

@Module({
  controllers: [OperatorsController],
})
export class OperatorsModule {}
