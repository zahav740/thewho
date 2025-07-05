/**
 * @file: v2-to-v1-converter.ts
 * @description: Конвертеры для преобразования V2 DTO в V1 DTO
 * @dependencies: create-order-v2.dto, create-order.dto
 * @created: 2025-07-05
 */
import { PriorityV2, WorkTypeV2, OperationTypeV2, CreateOperationV2Dto } from './create-order-v2.dto';

/**
 * Конвертирует PriorityV2 (строка) в числовой приоритет для старого DTO
 */
export const convertPriorityV2ToNumber = (priority: PriorityV2): number => {
  const mapping = {
    [PriorityV2.HIGH]: 1,
    [PriorityV2.MEDIUM]: 2,
    [PriorityV2.LOW]: 3,
    [PriorityV2.URGENT]: 4,
  };
  return mapping[priority] || 2; // По умолчанию средний приоритет
};

/**
 * Конвертирует WorkTypeV2 (enum) в строку для старого DTO - ТОЛЬКО ФРЕЗЕРНАЯ И ТОКАРНАЯ
 */
export const convertWorkTypeV2ToString = (workType: WorkTypeV2): string => {
  const mapping = {
    [WorkTypeV2.MILLING]: 'Фрезерная обработка',
    [WorkTypeV2.TURNING]: 'Токарная обработка',
  };
  return mapping[workType] || 'Фрезерная обработка'; // По умолчанию
};

/**
 * Конвертирует OperationTypeV2 в строку для старого DTO
 */
export const convertOperationTypeV2ToString = (operationType: OperationTypeV2): string => {
  // Старые DTO используют те же строки, что и новые enum
  return operationType;
};

/**
 * Конвертирует операцию V2 в операцию V1
 */
export const convertOperationV2ToV1 = (operation: CreateOperationV2Dto): any => {
  return {
    operationNumber: operation.operationNumber,
    operationType: convertOperationTypeV2ToString(operation.operationType),
    machineAxes: operation.machineAxes,
    estimatedTime: operation.estimatedTime,
  };
};

/**
 * Конвертирует числовой приоритет обратно в PriorityV2
 */
export const convertNumberToPriorityV2 = (priority: number): PriorityV2 => {
  const mapping = {
    1: PriorityV2.HIGH,
    2: PriorityV2.MEDIUM,
    3: PriorityV2.LOW,
    4: PriorityV2.URGENT,
  };
  return mapping[priority] || PriorityV2.MEDIUM;
};

/**
 * Конвертирует строку типа работы обратно в WorkTypeV2 - ТОЛЬКО ФРЕЗЕРНАЯ И ТОКАРНАЯ
 */
export const convertStringToWorkTypeV2 = (workType: string): WorkTypeV2 => {
  const normalized = workType.toLowerCase();
  
  if (normalized.includes('фрез') || normalized.includes('mill')) {
    return WorkTypeV2.MILLING;
  }
  if (normalized.includes('токар') || normalized.includes('turn')) {
    return WorkTypeV2.TURNING;
  }
  
  return WorkTypeV2.MILLING; // По умолчанию фрезерная
};
