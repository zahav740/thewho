/**
 * @file: machine.types.ts
 * @description: Типы для станков (обновленные под новую архитектуру)
 * @dependencies: -
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */

export enum MachineType {
  MILLING_3AXIS = 'milling-3axis',
  MILLING_4AXIS = 'milling-4axis',
  TURNING = 'turning',
}

// Новый тип для управления доступностью станков
export interface MachineAvailability {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  currentOperationDetails?: {
    id: number;
    operationNumber: number;
    operationType: string;
    estimatedTime: number;
    orderId: number;
    orderDrawingNumber: string;
  };
  lastFreedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy интерфейс для обратной совместимости
export interface Machine {
  id: string;
  code: string;
  type: MachineType;
  axes: number;
  isActive: boolean;
  isOccupied: boolean;
  createdAt: string;
  updatedAt: string;
  // Добавляем поля для совместимости с новым API
  machineName?: string;
  isAvailable?: boolean;
}

export interface CreateMachineDto {
  code: string;
  type: MachineType;
  axes: number;
}

export interface UpdateMachineDto extends Partial<CreateMachineDto> {
  isActive?: boolean;
  isOccupied?: boolean;
}

// Обновленный тип для рекомендуемых операций
export interface RecommendedOrder {
  orderId: string;
  operationId: string;
  drawingNumber: string;
  revision: string;
  quantity: number;
  operationNumber: number;
  operationType: string;
  estimatedTime: number;
  priority: number;
  deadline: string;
  pdfUrl?: string;
  previewUrl?: string;
  previewHtml?: string;
}

// Тип для запуска операции
export interface StartOperationRequest {
  machineId: string;
}

export interface StartOperationResponse {
  success: boolean;
  startDate: string;
  message: string;
  operation: {
    id: string;
    status: string;
    machine: string;
  };
}

// Утилитарные функции для работы с типами станков
export const getMachineTypeLabel = (type: string): string => {
  switch (type) {
    case 'milling-4axis':
      return 'Фрезерный 3-4 оси';
    case 'milling-3axis':
      return 'Фрезерный 3 оси';
    case 'turning':
      return 'Токарный';
    default:
      return type;
  }
};

export const getOperationTypeIcon = (type: string): string => {
  if (type.includes('фрезер') || type.includes('milling') || type === '3-axis' || type === '4-axis') {
    return '🔧';
  } else if (type.includes('токар') || type.includes('turning')) {
    return '⚙️';
  }
  return '🔨';
};

export const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 1:
      return '#ef4444'; // red
    case 2:
      return '#f59e0b'; // amber  
    case 3:
      return '#10b981'; // emerald
    default:
      return '#6b7280'; // gray
  }
};

export const formatEstimatedTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
};