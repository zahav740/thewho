/**
 * @file: shifts-filter.dto.ts
 * @description: DTO для фильтрации записей смен
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShiftsFilterDto {
  @ApiPropertyOptional({ example: '2024-01-01', description: 'Начальная дата' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Конечная дата' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID станка' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  machineId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID операции' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  operationId?: number;
}
