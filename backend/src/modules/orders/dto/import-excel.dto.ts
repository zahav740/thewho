/**
 * @file: import-excel.dto.ts
 * @description: DTO для импорта из Excel
 * @dependencies: class-validator
 * @created: 2025-01-28
 */
import { IsOptional, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportExcelDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Фильтры по цвету ячеек (ARGB коды)',
    example: ['FF00FF00', 'FFFF0000'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colorFilters?: string[];
}
