/**
 * @file: create-order.dto.ts
 * @description: DTO для создания заказа
 * @dependencies: class-validator
 * @created: 2025-01-28
 * @fixed: 2025-06-01 // Priority изменен на number, согласно требованиям фронтенда
 */
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OperationType } from '../../../database/entities/operation.entity';

export class CreateOperationDto {
  @ApiProperty({ example: 1, description: 'Номер операции' })
  @IsNumber()
  @Min(1)
  operationNumber: number;

  @ApiProperty({ enum: OperationType, description: 'Тип операции' })
  @IsEnum(OperationType)
  operationType: OperationType;

  @ApiProperty({ example: 3, description: 'Количество осей станка' })
  @IsNumber()
  @Min(3)
  machineAxes: number;

  @ApiProperty({ example: 120, description: 'Время выполнения в минутах' })
  @IsNumber()
  @Min(1)
  estimatedTime: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'DRW-2024-001', description: 'Номер чертежа' })
  @IsNotEmpty()
  @IsString()
  drawingNumber: string;

  @ApiProperty({ example: 100, description: 'Количество деталей' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2024-12-31', description: 'Срок выполнения' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ example: 1, description: 'Приоритет заказа (1-высокий, 2-средний, 3-низкий)' })
  @IsNotEmpty()
  @IsNumber()
  @IsIn([1, 2, 3, 4])
  priority: number; // Теперь число вместо строки

  @ApiPropertyOptional({ example: 'Фрезерная обработка', description: 'Тип работы' })
  @IsOptional()
  @IsString()
  workType?: string;

  @ApiProperty({ type: [CreateOperationDto], description: 'Операции заказа' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOperationDto)
  operations: CreateOperationDto[];
}