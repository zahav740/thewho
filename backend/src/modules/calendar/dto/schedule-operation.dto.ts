/**
 * @file: schedule-operation.dto.ts
 * @description: DTO для планирования операции (обновленный)
 * @dependencies: class-validator
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleOperationDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID операции (UUID)' })
  @IsString()
  operationId: string; // Изменено на string (UUID)

  @ApiProperty({ example: 'Doosan Yashana', description: 'ID станка' })
  @IsString()
  machineId: string; // Добавлено поле machineId

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Дата начала' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
