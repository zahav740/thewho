/**
 * @file: excel-import.service.ts
 * @description: Сервис для импорта заказов из Excel
 * @dependencies: exceljs, orders.service
 * @created: 2025-01-28
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Order, Priority } from '../../database/entities/order.entity';
import { Operation, OperationType } from '../../database/entities/operation.entity';
import { OrdersService } from './orders.service';
import type { Express } from 'express';

export interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ order: string; error: string }>;
}

interface ParsedOrder {
  drawingNumber: string;
  quantity: number;
  deadline: Date;
  priority: Priority;
  workType?: string;
  operations: Array<{
    operationNumber: number;
    operationType: OperationType;
    machineAxes: number;
    estimatedTime: number;
  }>;
}

@Injectable()
export class ExcelImportService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly ordersService: OrdersService,
  ) {}

  async importOrders(
    file: Express.Multer.File,
    colorFilters: string[] = [],
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден');
    }

    const orders: ParsedOrder[] = [];
    const errors: Array<{ order: string; error: string }> = [];

    // Предполагаемая структура Excel:
    // A: Номер чертежа, B: Количество, C: Срок, D: Приоритет, E: Тип работы
    // F-K: Операции (номер, тип, оси, время)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок

      try {
        if (this.shouldProcessRow(row, colorFilters)) {
          const order = this.parseRowToOrder(row);
          if (order) {
            orders.push(order);
          }
        }
      } catch (error) {
        errors.push({
          order: `Строка ${rowNumber}`,
          error: error.message,
        });
      }
    });

    return this.processImportedOrders(orders, errors);
  }

  private shouldProcessRow(row: ExcelJS.Row, colorFilters: string[]): boolean {
    if (colorFilters.length === 0) return true;

    const cell = row.getCell(1);
    const fill = cell.style?.fill;
    if (!fill || fill.type !== 'pattern') return false;
    
    const cellColor = (fill as any).fgColor?.argb;
    return cellColor ? colorFilters.includes(cellColor) : false;
  }

  private parseRowToOrder(row: ExcelJS.Row): ParsedOrder | null {
    const drawingNumber = row.getCell(1).value?.toString();
    if (!drawingNumber) return null;

    const quantity = parseInt(row.getCell(2).value?.toString() || '0', 10);
    const deadlineValue = row.getCell(3).value;
    const deadline = this.parseDate(deadlineValue);
    const priority = this.parsePriority(row.getCell(4).value?.toString());
    const workType = row.getCell(5).value?.toString();

    const operations = this.parseOperations(row);

    return {
      drawingNumber,
      quantity,
      deadline,
      priority,
      workType,
      operations,
    };
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      // Excel serial date
      return new Date((value - 25569) * 86400 * 1000);
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Неверный формат даты');
      }
      return date;
    }
    throw new Error('Дата не указана');
  }

  private parsePriority(value?: string): Priority {
    const priorityMap: Record<string, Priority> = {
      '1': Priority.CRITICAL,
      'критический': Priority.CRITICAL,
      '2': Priority.HIGH,
      'высокий': Priority.HIGH,
      '3': Priority.MEDIUM,
      'средний': Priority.MEDIUM,
      '4': Priority.LOW,
      'низкий': Priority.LOW,
    };

    const priority = priorityMap[value?.toLowerCase() || ''];
    return priority || Priority.MEDIUM;
  }

  private parseOperations(row: ExcelJS.Row): ParsedOrder['operations'] {
    const operations: ParsedOrder['operations'] = [];
    
    // Предполагаем, что операции начинаются с колонки F (6)
    // и каждая операция занимает 4 колонки
    for (let i = 6; i <= 30; i += 4) {
      const operationNumber = parseInt(row.getCell(i).value?.toString() || '0', 10);
      if (!operationNumber) break;

      const operationType = this.parseOperationType(row.getCell(i + 1).value?.toString());
      const machineAxes = parseInt(row.getCell(i + 2).value?.toString() || '3', 10);
      const estimatedTime = parseInt(row.getCell(i + 3).value?.toString() || '0', 10);

      operations.push({
        operationNumber,
        operationType,
        machineAxes,
        estimatedTime,
      });
    }

    return operations;
  }

  private parseOperationType(value?: string): OperationType {
    const typeMap: Record<string, OperationType> = {
      'фрезерная': OperationType.MILLING,
      'milling': OperationType.MILLING,
      'ф': OperationType.MILLING,
      'токарная': OperationType.TURNING,
      'turning': OperationType.TURNING,
      'т': OperationType.TURNING,
    };

    const type = typeMap[value?.toLowerCase() || ''];
    return type || OperationType.MILLING;
  }

  private async processImportedOrders(
    orders: ParsedOrder[],
    existingErrors: Array<{ order: string; error: string }>,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      created: 0,
      updated: 0,
      errors: existingErrors,
    };

    for (const orderData of orders) {
      try {
        const existingOrder = await this.ordersService.findByDrawingNumber(
          orderData.drawingNumber,
        );

        if (existingOrder) {
          await this.updateExistingOrder(existingOrder, orderData);
          result.updated++;
        } else {
          await this.createNewOrder(orderData);
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          order: orderData.drawingNumber,
          error: error.message,
        });
      }
    }

    return result;
  }

  private async createNewOrder(orderData: ParsedOrder): Promise<void> {
    const order = this.orderRepository.create({
      drawingNumber: orderData.drawingNumber,
      quantity: orderData.quantity,
      remainingQuantity: orderData.quantity,
      deadline: orderData.deadline,
      priority: orderData.priority,
      status: 'planned',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Создаем операции
    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        sequenceNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        order: savedOrder,
      });
      await this.operationRepository.save(operation);
    }
  }

  private async updateExistingOrder(
    existingOrder: Order,
    orderData: ParsedOrder,
  ): Promise<void> {
    // Обновляем данные заказа
    existingOrder.quantity = orderData.quantity;
    existingOrder.remainingQuantity = orderData.quantity;
    existingOrder.deadline = orderData.deadline;
    existingOrder.priority = orderData.priority;

    await this.orderRepository.save(existingOrder);

    // Удаляем старые операции и создаем новые
    await this.operationRepository.delete({ order: { id: existingOrder.id } });

    for (const opData of orderData.operations) {
      const operation = this.operationRepository.create({
        sequenceNumber: opData.operationNumber,
        operationType: opData.operationType,
        estimatedTime: opData.estimatedTime,
        order: existingOrder,
      });
      await this.operationRepository.save(operation);
    }
  }
}
