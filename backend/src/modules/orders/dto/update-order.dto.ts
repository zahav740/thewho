/**
 * @file: update-order.dto.ts
 * @description: DTO для обновления заказа (исправленный)
 * @dependencies: create-order.dto
 * @created: 2025-01-28
 * @fixed: 2025-06-01 // Priority изменен на number, согласно требованиям фронтенда
 */
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType } from '../../../database/entities/operation.entity';

// UpdateOperationDto: поля для создания/обновления операции сделаны обязательными
export class UpdateOperationDto {
  @ApiProperty({ example: 1, description: 'Номер операции' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  operationNumber: number;

  @ApiProperty({ enum: OperationType, description: 'Тип операции' })
  @IsNotEmpty()
  @IsEnum(OperationType)
  operationType: OperationType;

  @ApiProperty({ example: 3, description: 'Количество осей станка' })
  @IsNotEmpty()
  @IsNumber()
  @Min(3)
  machineAxes: number;

  @ApiProperty({ example: 120, description: 'Время выполнения в минутах' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  estimatedTime: number;

  @ApiPropertyOptional({ description: 'ID существующей операции (UUID, если у вас ID операций - uuid)' })
  @IsOptional()
  @IsString() // Если ID операции UUID
  id?: string;

  @ApiPropertyOptional({ example: 'in_progress', description: 'Статус операции' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 50, description: 'Количество выполненных единиц' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedUnits?: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'DRW-2024-001-MOD', description: 'Новый номер чертежа' })
  @IsOptional()
  @IsString()
  drawingNumber?: string;

  @ApiPropertyOptional({ example: 150, description: 'Новое количество деталей' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: '2025-01-15', description: 'Новый срок выполнения' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: 1, description: 'Новый приоритет заказа (1-высокий, 2-средний, 3-низкий)' })
  @IsOptional()
  @IsNumber()
  @IsIn([1, 2, 3, 4]) // Теперь числа вместо строк
  priority?: number; // Теперь число вместо строки

  @ApiPropertyOptional({ example: 'Токарно-фрезерная обработка', description: 'Новый тип работы' })
  @IsOptional()
  @IsString()
  workType?: string;

  @ApiPropertyOptional({ type: [UpdateOperationDto], description: 'Обновленный список операций заказа' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOperationDto)
  operations?: UpdateOperationDto[];
}