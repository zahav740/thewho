/**
 * @file: order-v2.types.ts
 * @description: Типы для улучшенной версии заказов V2
 * @created: 2025-07-03
 */

// Приоритеты для V2 (строковые значения для совместимости с backend)
export enum PriorityV2 {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  URGENT = 'URGENT',
}

// Типы работ V2 - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ (ФРЕЗЕРНАЯ И ТОКАРНАЯ)
export enum WorkTypeV2 {
  MILLING = 'MILLING',
  TURNING = 'TURNING', 
}

// Типы операций для V2 - ИСПРАВЛЕНО
export enum OperationTypeV2 {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
  DRILLING = 'DRILLING',
  GRINDING = 'GRINDING',
}

// Операция для формы V2
export interface OrderFormOperationV2Dto {
  operationNumber: number;
  operationType: OperationTypeV2;
  machineAxes: number;
  estimatedTime: number;
}

// Операция V2 (расширенная)
export interface OperationV2 {
  id?: number;
  operationNumber: number;
  operationType: OperationTypeV2;
  machineAxes: number;
  estimatedTime: number;
  status?: string;
  assignedMachine?: number;
  assignedAt?: string;
  completedAt?: string;
  actualQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Заказ V2 (расширенный)
export interface OrderV2 {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: PriorityV2; // Используем enum
  workType: string;
  pdfPath?: string;
  pdfUrl?: string;
  operations?: OperationV2[];
  createdAt: string;
  updatedAt: string;
  
  // Расширенные поля для V2
  calculatedPriority?: string;
  priorityReason?: string;
  complexityScore?: number;
  urgencyScore?: number;
  status?: string;
  completionPercentage?: number;
  daysLeft?: number;
}

// DTO для создания заказа V2 - ИСПРАВЛЕНО
export interface CreateOrderV2Dto {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: PriorityV2;
  workType: WorkTypeV2; // Обязательное поле с enum
  operations: OrderFormOperationV2Dto[];
}

// DTO для обновления заказа V2
export interface UpdateOrderV2Dto {
  drawingNumber?: string;
  quantity?: number;
  deadline?: string;
  priority?: PriorityV2;
  workType?: string;
  operations?: OrderFormOperationV2Dto[];
}

// Фильтр для заказов V2
export interface OrdersV2Filter {
  page: number;
  limit: number;
  search?: string;
  priority?: PriorityV2; // Используем enum
  status?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
}

// Ответ API для списка заказов V2
export interface OrdersV2Response {
  data: OrderV2[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Статистика заказов V2
export interface OrdersV2Stats {
  total: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  complexity: {
    simple: number;
    medium: number;
    complex: number;
  };
  avgProcessingTime: number;
  urgentCount: number;
}

// Результат импорта Excel V2
export interface ExcelImportV2Result {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  total: number;
  prioritized: boolean;
  stats?: {
    total: number;
    high: number;
    medium: number;
    low: number;
    overdue: number;
  };
  errorDetails?: Array<{
    order: string;
    error: string;
  }>;
  message?: string;
}

// Результат расчета приоритета
export interface PriorityCalculationResult {
  priority: PriorityV2;
  reason: string;
  urgencyScore: number;
  complexityScore: number;
  finalScore: number;
}

// Утилитарные функции для маппинга (фронтенд)

// Маппинг типов работ из Excel - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ
export const getWorkTypeFromExcel = (excelWorkType: string): WorkTypeV2 => {
  if (!excelWorkType || typeof excelWorkType !== 'string') {
    return WorkTypeV2.MILLING; // По умолчанию фрезерная
  }
  
  const normalized = excelWorkType.toString().toLowerCase().trim();
  
  // Маппинг русских и ивритских названий - ТОЛЬКО ФРЕЗЕРНАЯ И ТОКАРНАЯ
  if (normalized.includes('фрез') || normalized.includes('mill') || normalized.includes('כרסום')) {
    return WorkTypeV2.MILLING;
  }
  if (normalized.includes('токар') || normalized.includes('turn') || normalized.includes('חרטה')) {
    return WorkTypeV2.TURNING;
  }
  
  // По умолчанию фрезерная обработка
  return WorkTypeV2.MILLING;
};

// Определение типа операции по типу работы - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ
export const getOperationTypeFromWorkType = (workType: WorkTypeV2): OperationTypeV2 => {
  switch (workType) {
    case WorkTypeV2.MILLING:
      return OperationTypeV2.MILLING;
    case WorkTypeV2.TURNING:
      return OperationTypeV2.TURNING;
    default:
      return OperationTypeV2.MILLING; // По умолчанию фрезерная
  }
};

// Маппинг приоритетов для отображения
export const getPriorityV2FromString = (priorityString: string): PriorityV2 => {
  if (!priorityString) return PriorityV2.MEDIUM;
  
  const normalized = priorityString.toLowerCase().trim();
  
  if (normalized.includes('высок') || normalized.includes('high') || normalized === 'high') {
    return PriorityV2.HIGH;
  }
  if (normalized.includes('средн') || normalized.includes('medium') || normalized === 'medium') {
    return PriorityV2.MEDIUM;
  }
  if (normalized.includes('низк') || normalized.includes('low') || normalized === 'low') {
    return PriorityV2.LOW;
  }
  if (normalized.includes('срочн') || normalized.includes('urgent') || normalized === 'urgent') {
    return PriorityV2.URGENT;
  }
  
  return PriorityV2.MEDIUM;
};

// ОБРАТНЫЙ КОНВЕРТЕР: из строки БД в enum WorkTypeV2 - ТОЛЬКО РЕАЛЬНЫЕ ТИПЫ
export const getWorkTypeEnumFromString = (text: string): WorkTypeV2 => {
  if (!text) return WorkTypeV2.MILLING; // По умолчанию фрезерная
  
  const normalized = text.toLowerCase().trim();
  
  // Поскольку у вас только фрезерная и токарная
  if (normalized.includes('фрез') || normalized.includes('mill') || normalized.includes('כרסום')) {
    return WorkTypeV2.MILLING;
  }
  if (normalized.includes('токар') || normalized.includes('turn') || normalized.includes('חרטה')) {
    return WorkTypeV2.TURNING;
  }
  
  // По умолчанию фрезерная
  return WorkTypeV2.MILLING;
};
