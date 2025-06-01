/**
 * @file: machines.module.ts
 * @description: Модуль для управления станками (упрощенный)
 * @dependencies: упрощенные сервисы
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesSimpleController } from './machines-simple.controller';
import { MachineAvailabilitySimpleService } from './machine-availability-simple.service';

@Module({
  imports: [
    // Оставляем пустым, так как используем DataSource
  ],
  controllers: [MachinesSimpleController],
  providers: [MachineAvailabilitySimpleService],
  exports: [MachineAvailabilitySimpleService],
})
export class MachinesModule {}
