/**
 * @file: create-order-v2.dto.ts
 * @description: DTO для создания заказа V2 с поддержкой строковых приоритетов
 * @dependencies: class-validator
 * @created: 2025-07-05
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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { OperationType } from '../../../database/entities/operation.entity';

// Enum для приоритетов V2 (строковые значения)
export enum PriorityV2 {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  URGENT = 'URGENT',
}

// Типы работ V2 - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ (ФРЕЗЕРНАЯ И ТОКАРНАЯ)
export enum WorkTypeV2 {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
}

// Enum для операций V2 - ИСПРАВЛЕН для соответствия бэкенду
export enum OperationTypeV2 {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
  DRILLING = 'DRILLING',
  GRINDING = 'GRINDING',
}

export class CreateOperationV2Dto {
  @ApiProperty({ example: 1, description: 'Номер операции' })
  @IsNumber()
  @Min(1)
  operationNumber: number;

  @ApiProperty({ enum: OperationTypeV2, description: 'Тип операции V2' })
  @IsEnum(OperationTypeV2)
  operationType: OperationTypeV2;

  @ApiProperty({ example: 3, description: 'Количество осей станка' })
  @IsNumber()
  @Min(3)
  machineAxes: number;

  @ApiProperty({ example: 120, description: 'Время выполнения в минутах' })
  @IsNumber()
  @Min(1)
  estimatedTime: number;
}

export class CreateOrderV2Dto {
  @ApiProperty({ example: 'DRW-2024-001', description: 'Номер чертежа' })
  @IsNotEmpty()
  @IsString()
  drawingNumber: string;

  @ApiProperty({ example: 100, description: 'Количество деталей' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: '2024-12-31', description: 'Срок выполнения в формате YYYY-MM-DD' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ 
    enum: PriorityV2, 
    example: PriorityV2.HIGH, 
    description: 'Приоритет заказа (строковое значение)' 
  })
  @IsNotEmpty()
  @IsEnum(PriorityV2)
  priority: PriorityV2;

  @ApiProperty({ 
    enum: WorkTypeV2, 
    example: WorkTypeV2.MILLING, 
    description: 'Тип работы (строковое значение)' 
  })
  @IsEnum(WorkTypeV2)
  workType: WorkTypeV2;

  @ApiProperty({ type: [CreateOperationV2Dto], description: 'Операции заказа' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOperationV2Dto)
  operations: CreateOperationV2Dto[];
}

// Утилитарная функция для конвертации строковых приоритетов в числовые
export const convertPriorityV2ToNumber = (priority: PriorityV2): number => {
  const mapping = {
    [PriorityV2.HIGH]: 1,
    [PriorityV2.MEDIUM]: 2,
    [PriorityV2.LOW]: 3,
    [PriorityV2.URGENT]: 4,
  };
  return mapping[priority] || 2; // По умолчанию средний приоритет
};

// Утилитарная функция для конвертации числовых приоритетов в строковые
export const convertNumberToPriorityV2 = (priority: number): PriorityV2 => {
  const mapping = {
    1: PriorityV2.HIGH,
    2: PriorityV2.MEDIUM,
    3: PriorityV2.LOW,
    4: PriorityV2.URGENT,
  };
  return mapping[priority] || PriorityV2.MEDIUM; // По умолчанию средний приоритет
};

// Также экспортируем для использования в других файлах
export { OperationType };
