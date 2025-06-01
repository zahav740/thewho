/**
 * @file: create-operation.dto.ts
 * @description: DTO для создания операции
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: 1, description: 'ID заказа' })
  @IsNumber()
  orderId: number;
}
