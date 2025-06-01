/**
 * @file: create-machine.dto.ts
 * @description: DTO для создания станка
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MachineType } from '../../../database/entities/machine.entity';

export class CreateMachineDto {
  @ApiProperty({ example: 'F1', description: 'Код станка' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ enum: MachineType, description: 'Тип станка' })
  @IsEnum(MachineType)
  type: MachineType;

  @ApiProperty({ example: 3, description: 'Количество осей' })
  @IsNumber()
  @Min(3)
  axes: number;
}
