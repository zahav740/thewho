/**
 * @file: shifts.module.ts
 * @description: Модуль для управления сменами
 * @dependencies: TypeORM, ShiftRecord entity, ShiftsService
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Убран конфликт контроллеров
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
// Убираем простой контроллер, чтобы избежать конфликтов
// import { ShiftsSimpleController } from './shifts-simple.controller';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftRecord])
  ],
  controllers: [ShiftsController], // Только основной контроллер
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
