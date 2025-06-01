/**
 * @file: shift.types.ts
 * @description: Типы для смен
 * @dependencies: -
 * @created: 2025-01-28
 */

export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export interface ShiftRecord {
  id: number;
  date: string;
  shiftType: ShiftType;
  setupStartDate?: string;
  setupOperator?: string;
  setupType?: string;
  setupTime?: number;
  dayShiftQuantity?: number;
  dayShiftOperator?: string;
  dayShiftTimePerUnit?: number;
  nightShiftQuantity?: number;
  nightShiftOperator?: string;
  nightShiftTimePerUnit?: number;
  operationId: number;
  machineId: number;
  createdAt: string;
}

export interface CreateShiftRecordDto {
  date: string;
  shiftType: ShiftType;
  setupStartDate?: string;
  setupOperator?: string;
  setupType?: string;
  setupTime?: number;
  dayShiftQuantity?: number;
  dayShiftOperator?: string;
  dayShiftTimePerUnit?: number;
  nightShiftQuantity?: number;
  nightShiftOperator?: string;
  nightShiftTimePerUnit?: number;
  operationId: number;
  machineId: number;
}

export interface UpdateShiftRecordDto extends Partial<CreateShiftRecordDto> {}

export interface ShiftsFilter {
  startDate?: string;
  endDate?: string;
  machineId?: number;
  operationId?: number;
}

export interface ShiftStatistics {
  totalRecords: number;
  totalSetupTime: number;
  totalProductionTime: number;
  totalQuantity: number;
  dayShiftStats: {
    totalQuantity: number;
    totalTime: number;
  };
  nightShiftStats: {
    totalQuantity: number;
    totalTime: number;
  };
  operatorStats: Array<{
    operatorName: string;
    totalQuantity: number;
    totalTime: number;
  }>;
}
