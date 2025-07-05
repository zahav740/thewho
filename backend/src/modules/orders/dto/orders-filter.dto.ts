/**
 * @file: orders-filter.dto.ts
 * @description: DTO для фильтрации заказов
 * @dependencies: class-validator
 * @created: 2025-01-28
 * @fixed: 2025-05-31 // Priority изменен на string
 */
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator'; // IsEnum убран
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// Priority enum из сущности не используется для валидации

export class OrdersFilterDto {
  @ApiPropertyOptional({ example: 1, description: 'Номер страницы' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 100, description: 'Количество записей на странице' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 1000; // Увеличиваем лимит до 1000 заказов

  @ApiPropertyOptional({ example: '2', description: 'Фильтр по приоритету (строки "1", "2", "3", "4")' })
  @IsOptional()
  @IsString()
  @IsIn(['1', '2', '3', '4'])
  priority?: string; // ТЕПЕРЬ СТРОКА

  @ApiPropertyOptional({ description: 'Поиск по номеру чертежа или типу работы' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по статусу операций' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Фильтр по дедлайну от' })
  @IsOptional()
  @IsString()
  deadlineFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Фильтр по дедлайну до' })
  @IsOptional()
  @IsString()
  deadlineTo?: string;
}