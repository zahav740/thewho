/**
 * @file: machine-schedule.dto.ts
 * @description: DTO для расписания станка
 * @dependencies: -
 * @created: 2025-01-28
 */
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from '../../../database/entities/shift-record.entity';

export class ShiftInfoDto {
  @ApiProperty({ enum: ShiftType })
  shiftType: ShiftType;

  @ApiProperty()
  operationId: string; // Изменено на string (UUID)

  @ApiProperty()
  orderDrawingNumber: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  operator: string;
}

export class CurrentOperationDto {
  @ApiProperty()
  operationId: string; // Изменено на string (UUID)

  @ApiProperty()
  orderDrawingNumber: string;

  @ApiProperty()
  operationNumber: number;

  @ApiProperty()
  estimatedTime: number;
}

export class DayScheduleDto {
  @ApiProperty()
  date: string; // Изменено на string

  @ApiProperty()
  shifts: ShiftInfoDto[];

  @ApiProperty({ type: CurrentOperationDto, required: false })
  currentOperation?: CurrentOperationDto;
}

export class MachineScheduleDto {
  @ApiProperty()
  machineId: string; // Изменено на string

  @ApiProperty()
  date: string;

  @ApiProperty({ type: [DayScheduleDto] })
  daySchedule: DayScheduleDto[];
}
