/**
 * @file: machines.module.ts
 * @description: Модуль для управления станками (исправленный)
 * @dependencies: MachinesService, MachinesController
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Исправлен для работы с существующей БД
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Machine, Operation]),
  ],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
