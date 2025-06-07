/**
 * @file: create-shift-record.dto.ts
 * @description: DTO для создания записи смены (ОБНОВЛЕН - добавлен setupOperator)
 * @dependencies: class-validator
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлено поле setupOperator
 */
import {
  IsDateString,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShiftRecordDto {
  @ApiProperty({ example: '2024-01-15', description: 'Дата смены' })
  @IsDateString({}, { message: 'Поле date должно быть корректной датой в формате YYYY-MM-DD' })
  date: string;

  @ApiProperty({ example: 'DAY', description: 'Тип смены (DAY/NIGHT)' })
  @IsString({ message: 'Поле shiftType должно быть строкой' })
  shiftType: string;

  @ApiPropertyOptional({ example: 120, description: 'Время наладки в минутах' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле setupTime должно быть числом' })
  @Min(0, { message: 'Время наладки не может быть отрицательным' })
  setupTime?: number;

  @ApiPropertyOptional({ example: 'Иван', description: 'Оператор наладки' })
  @IsOptional()
  @IsString({ message: 'Поле setupOperator должно быть строкой' })
  setupOperator?: string;

  @ApiPropertyOptional({ example: 50, description: 'Количество деталей в дневную смену' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле dayShiftQuantity должно быть числом' })
  @Min(0, { message: 'Количество деталей не может быть отрицательным' })
  dayShiftQuantity?: number;

  @ApiPropertyOptional({ example: 'Петр', description: 'Оператор дневной смены' })
  @IsOptional()
  @IsString({ message: 'Поле dayShiftOperator должно быть строкой' })
  dayShiftOperator?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Время на деталь в дневную смену (в минутах)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле dayShiftTimePerUnit должно быть числом' })
  @Min(0, { message: 'Время на деталь не может быть отрицательным' })
  dayShiftTimePerUnit?: number;

  @ApiPropertyOptional({ example: 45, description: 'Количество деталей в ночную смену' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле nightShiftQuantity должно быть числом' })
  @Min(0, { message: 'Количество деталей не может быть отрицательным' })
  nightShiftQuantity?: number;

  @ApiPropertyOptional({ example: 'Аркадий', description: 'Оператор ночной смены' })
  @IsOptional()
  @IsString({ message: 'Поле nightShiftOperator должно быть строкой' })
  nightShiftOperator?: string;

  @ApiPropertyOptional({ example: 6.0, description: 'Время на деталь в ночную смену (в минутах)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле nightShiftTimePerUnit должно быть числом' })
  @Min(0, { message: 'Время на деталь не может быть отрицательным' })
  nightShiftTimePerUnit?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID операции' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле operationId должно быть числом' })
  operationId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID станка' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Поле machineId должно быть числом' })
  machineId?: number;

  @ApiPropertyOptional({ example: 'C6HP0021A', description: 'Номер чертежа' })
  @IsOptional()
  @IsString({ message: 'Поле drawingNumber должно быть строкой' })
  drawingNumber?: string;
}
