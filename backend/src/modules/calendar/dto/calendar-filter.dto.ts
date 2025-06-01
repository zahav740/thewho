/**
 * @file: calendar-filter.dto.ts
 * @description: DTO для фильтрации календаря
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalendarFilterDto {
  @ApiProperty({ example: '2024-01-01', description: 'Начальная дата' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31', description: 'Конечная дата' })
  @IsDateString()
  endDate: string;
}
