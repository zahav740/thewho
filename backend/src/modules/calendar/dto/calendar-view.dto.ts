/**
 * @file: calendar-view.dto.ts
 * @description: DTO для представления календаря
 * @dependencies: machine-schedule.dto
 * @created: 2025-01-28
 */
import { ApiProperty } from '@nestjs/swagger';
import { MachineScheduleDto } from './machine-schedule.dto';

export class CalendarViewDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalWorkingDays: number;

  @ApiProperty({ type: [MachineScheduleDto] })
  machineSchedules: MachineScheduleDto[];
}
