/**
 * @file: excel-import.utils.ts
 * @description: Утилитарные функции для работы с Excel импортом
 * @dependencies: create-order-v2.dto
 * @created: 2025-07-05
 */
import { WorkTypeV2, OperationTypeV2 } from '../dto/create-order-v2.dto';

/**
 * Конвертирует строковое значение из Excel в WorkTypeV2 enum
 */
export const getWorkTypeFromExcel = (excelValue: string): WorkTypeV2 => {
  if (!excelValue) {
    return WorkTypeV2.MILLING; // По умолчанию фрезерная
  }
  
  const normalized = excelValue.toLowerCase().trim();
  
  // Проверяем на фрезерную обработку
  if (
    normalized.includes('фрез') ||
    normalized.includes('mill') ||
    normalized.includes('milling') ||
    normalized.includes('cnc') ||
    normalized.includes('обработка') ||
    normalized === 'milling'
  ) {
    return WorkTypeV2.MILLING;
  }
  
  // Проверяем на токарную обработку
  if (
    normalized.includes('токар') ||
    normalized.includes('turn') ||
    normalized.includes('turning') ||
    normalized.includes('lathe') ||
    normalized === 'turning'
  ) {
    return WorkTypeV2.TURNING;
  }
  
  // По умолчанию возвращаем фрезерную
  return WorkTypeV2.MILLING;
};

/**
 * Определяет тип операции на основе типа работы
 */
export const getOperationTypeFromWorkType = (workType: WorkTypeV2): OperationTypeV2 => {
  switch (workType) {
    case WorkTypeV2.MILLING:
      return OperationTypeV2.MILLING;
    case WorkTypeV2.TURNING:
      return OperationTypeV2.TURNING;
    default:
      return OperationTypeV2.MILLING; // По умолчанию
  }
};

/**
 * Конвертирует строковое значение приоритета из Excel
 */
export const getPriorityFromExcel = (excelValue: string): string => {
  if (!excelValue) {
    return 'MEDIUM';
  }
  
  const normalized = excelValue.toLowerCase().trim();
  
  if (normalized.includes('высок') || normalized.includes('high') || normalized === '1') {
    return 'HIGH';
  }
  if (normalized.includes('средн') || normalized.includes('medium') || normalized === '2') {
    return 'MEDIUM';
  }
  if (normalized.includes('низк') || normalized.includes('low') || normalized === '3') {
    return 'LOW';
  }
  if (normalized.includes('срочн') || normalized.includes('urgent') || normalized === '4') {
    return 'URGENT';
  }
  
  return 'MEDIUM'; // По умолчанию
};

/**
 * Валидирует номер чертежа и генерирует если нужно
 */
export const validateOrGenerateDrawingNumber = (drawingNumber: string | null, rowIndex: number): string => {
  if (drawingNumber && drawingNumber.trim().length > 0) {
    return drawingNumber.trim();
  }
  
  // Генерируем номер чертежа
  const timestamp = Date.now();
  const hash = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `AUTO-${rowIndex}-${hash}-${timestamp}`;
};

/**
 * Нормализует количество
 */
export const normalizeQuantity = (quantity: any): number => {
  const num = Number(quantity);
  return isNaN(num) || num <= 0 ? 1 : Math.floor(num);
};
