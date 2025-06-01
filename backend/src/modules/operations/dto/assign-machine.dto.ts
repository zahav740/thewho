/**
 * @file: assign-machine.dto.ts
 * @description: DTO для назначения станка операции
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMachineDto {
  @ApiProperty({ example: 1, description: 'ID станка' })
  @IsNumber()
  machineId: number;
}
