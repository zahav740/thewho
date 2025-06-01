/**
 * @file: shift-statistics.dto.ts
 * @description: DTO для статистики смен
 * @dependencies: -
 * @created: 2025-01-28
 */
import { ApiProperty } from '@nestjs/swagger';

export class OperatorStatDto {
  @ApiProperty()
  operatorName: string;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  totalTime: number;
}

export class ShiftStatDto {
  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  totalTime: number;
}

export class ShiftStatisticsDto {
  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  totalSetupTime: number;

  @ApiProperty()
  totalProductionTime: number;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty({ type: ShiftStatDto })
  dayShiftStats: ShiftStatDto;

  @ApiProperty({ type: ShiftStatDto })
  nightShiftStats: ShiftStatDto;

  @ApiProperty({ type: [OperatorStatDto] })
  operatorStats: OperatorStatDto[];
}
