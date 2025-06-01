/**
 * @file: update-operation.dto.ts
 * @description: DTO для обновления операции
 * @dependencies: create-operation.dto
 * @created: 2025-01-28
 */
import { PartialType } from '@nestjs/swagger';
import { CreateOperationDto } from './create-operation.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OperationStatus } from '../../../database/entities/operation.entity';

export class UpdateOperationDto extends PartialType(CreateOperationDto) {
  @ApiPropertyOptional({ enum: OperationStatus, description: 'Статус операции' })
  @IsOptional()
  @IsEnum(OperationStatus)
  status?: OperationStatus;
}
