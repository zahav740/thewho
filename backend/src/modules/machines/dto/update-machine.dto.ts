/**
 * @file: update-machine.dto.ts
 * @description: DTO для обновления станка
 * @dependencies: create-machine.dto
 * @created: 2025-01-28
 */
import { PartialType } from '@nestjs/swagger';
import { CreateMachineDto } from './create-machine.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMachineDto extends PartialType(CreateMachineDto) {
  @ApiPropertyOptional({ description: 'Активен ли станок' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Занят ли станок' })
  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;
}
