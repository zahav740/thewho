/**
 * @file: order.types.ts
 * @description: Типы для заказов
 * @dependencies: operation.types
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Обновлена логика приоритетов
 */

import { Operation, OperationType } from './operation.types';

// Обновленная логика приоритетов
export enum Priority {
  HIGH = 1,      // Высокий
  MEDIUM = 2,    // Средний
  LOW = 3,       // Низкий
  // Удалено значение CRITICAL, так как оно больше не используется
}

export interface Order {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: Priority;
  workType?: string;
  pdfPath?: string;
  pdfUrl?: string; // URL для просмотра PDF
  operations: Operation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: Priority;
  workType?: string;
  operations: OrderFormOperationDto[];
}

export interface UpdateOrderDto extends Partial<Omit<CreateOrderDto, 'operations'>> {
  operations?: OrderFormOperationDto[];
}

export interface CreateOperationDto {
  operationNumber: number;
  operationType: 'MILLING' | 'TURNING';
  machineAxes: number; // Число (3 или 4)
  estimatedTime: number;
}

// Для формы создания заказа (без orderId)
export interface OrderFormOperationDto {
  operationNumber: number;
  operationType: OperationType;
  machineAxes: number; // Число (3 или 4)
  estimatedTime: number;
}

export interface OrdersFilter {
  page?: number;
  limit?: number;
  priority?: Priority;
  search?: string;
  status?: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
}
