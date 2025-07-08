/**
 * @file: operators.module.ts
 * @description: Модуль для операторов
 * @dependencies: OperatorsController, TypeORM
 * @created: 2025-06-09
 * @updated: 2025-07-01
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorsController } from './operators.controller';
import { Operator } from '../../database/entities/operator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Operator])],
  controllers: [OperatorsController],
})
export class OperatorsModule {}
