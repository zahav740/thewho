/**
 * @file: create-shift-record.dto.ts
 * @description: DTO для создания записи смены
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../../database/entities/shift-record.entity';

export class CreateShiftRecordDto {
  @ApiProperty({ example: '2024-01-15', description: 'Дата смены' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ShiftType, description: 'Тип смены' })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Дата начала наладки' })
  @IsOptional()
  @IsDateString()
  setupStartDate?: string;

  @ApiPropertyOptional({ example: 'Иван', description: 'Оператор наладки' })
  @IsOptional()
  @IsString()
  setupOperator?: string;

  @ApiPropertyOptional({ example: 'Первичная', description: 'Тип наладки' })
  @IsOptional()
  @IsString()
  setupType?: string;

  @ApiPropertyOptional({ example: 120, description: 'Время наладки в минутах' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setupTime?: number;

  @ApiPropertyOptional({ example: 50, description: 'Количество деталей в дневную смену' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dayShiftQuantity?: number;

  @ApiPropertyOptional({ example: 'Петр', description: 'Оператор дневной смены' })
  @IsOptional()
  @IsString()
  dayShiftOperator?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Время на деталь в дневную смену' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dayShiftTimePerUnit?: number;

  @ApiPropertyOptional({ example: 45, description: 'Количество деталей в ночную смену' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightShiftQuantity?: number;

  @ApiPropertyOptional({ example: 'Аркадий', description: 'Оператор ночной смены' })
  @IsOptional()
  @IsString()
  nightShiftOperator?: string;

  @ApiPropertyOptional({ example: 6.0, description: 'Время на деталь в ночную смену' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nightShiftTimePerUnit?: number;

  @ApiProperty({ example: 1, description: 'ID операции' })
  @IsNumber()
  operationId: number;

  @ApiProperty({ example: 1, description: 'ID станка' })
  @IsNumber()
  machineId: number;
}
