/**
 * @file: shift.types.ts
 * @description: Типы для смен (ОБНОВЛЕНЫ - добавлен оператор наладки)
 * @dependencies: -
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлено поле setupOperator
 */

export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export interface ShiftRecord {
  id: number;
  date: string;
  shiftType: ShiftType;
  setupTime?: number;
  setupOperator?: string; // Добавлено поле оператора наладки
  dayShiftQuantity?: number;
  dayShiftOperator?: string;
  dayShiftTimePerUnit?: number;
  nightShiftQuantity?: number;
  nightShiftOperator?: string;
  nightShiftTimePerUnit?: number;
  operationId?: number;
  machineId?: number;
  drawingNumber?: string;
  createdAt: string;
  
  // Обогащенные данные от связанных таблиц
  machineCode?: string;
  machineType?: string;
  operationNumber?: number;
  operationType?: string;
  orderDrawingNumber?: string;
  orderId?: number;
  
  // Связанные объекты (если нужны)
  machine?: {
    id: number;
    code: string;
    type: string;
    axes: number;
  };
  operation?: {
    id: number;
    operationNumber: number;
    operationType: string;
    estimatedTime: number;
    order?: {
      id: number;
      drawingNumber: string;
    };
  };
}

export interface CreateShiftRecordDto {
  date: string;
  shiftType: ShiftType;
  setupTime?: number;
  setupOperator?: string; // Добавлено поле оператора наладки
  dayShiftQuantity?: number;
  dayShiftOperator?: string;
  dayShiftTimePerUnit?: number;
  nightShiftQuantity?: number;
  nightShiftOperator?: string;
  nightShiftTimePerUnit?: number;
  operationId?: number;
  machineId?: number;
  drawingNumber?: string;
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
