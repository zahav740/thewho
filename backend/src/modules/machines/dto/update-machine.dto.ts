import { PartialType } from '@nestjs/swagger';
import { CreateMachineDto } from './create-machine.dto';
import { IsBoolean, IsOptional, IsNumber, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMachineDto extends PartialType(CreateMachineDto) {
  @ApiPropertyOptional({ description: 'Активен ли станок' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Занят ли станок' })
  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;

  @ApiPropertyOptional({ description: 'ID текущей операции' })
  @IsOptional()
  @IsNumber()
  currentOperation?: number;

  @ApiPropertyOptional({ description: 'Время назначения операции' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  assignedAt?: Date;
}
