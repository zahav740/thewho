/**
 * @file: types.ts
 * @description: Локальные типы для Orders V2
 * @created: 2025-07-03
 */

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface OrderV2 {
  id: number;
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: Priority | string;
  workType: string;
  operations?: any[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderV2Dto {
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: Priority | string;
  workType: string;
  operations: any[];
}

export interface OrdersResponseV2 {
  data: OrderV2[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
