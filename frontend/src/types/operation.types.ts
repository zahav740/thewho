/**
 * @file: operation.types.ts
 * @description: Типы для операций
 * @dependencies: -
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Обновлены типы machineAxes как числа
 */

export enum OperationType {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
  DRILLING = 'DRILLING',
  GRINDING = 'GRINDING',
}

export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Operation {
  id: number;
  operationNumber: number;
  operationType: OperationType;
  machineAxes: number; // Число (3 или 4)
  estimatedTime: number;
  status: string;
  orderId: number;
  machineId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationDto {
  operationNumber: number;
  operationType: OperationType;
  machineAxes: number; // Число (3 или 4)
  estimatedTime: number;
  orderId: number;
}

export interface UpdateOperationDto extends Partial<CreateOperationDto> {
  status?: OperationStatus;
}

export interface AssignMachineDto {
  machineId: number;
}
