/**
 * @file: operation.entity.ts
 * @description: МИНИМАЛЬНЫЙ Entity для избежания TypeScript ошибок
 * @dependencies: typeorm, order.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 // Только необходимые поля БЕЗ сложных связей
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

export enum OperationType {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
  DRILLING = 'DRILLING',
  GRINDING = 'GRINDING',
}

@Entity('operations')
export class Operation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'operationNumber' })
  operationNumber: number;

  // Алиас для совместимости
  get sequenceNumber(): number {
    return this.operationNumber;
  }

  @Column({ name: 'operationtype', nullable: true })
  operationType: string;

  @Column({ name: 'estimatedTime' })
  estimatedTime: number;

  @Column({ name: 'machineaxes', nullable: true })
  machineAxes: number;

  @Column({ default: 'PENDING' })
  status: string;

  // Простое строковое поле для машины (без связей)
  @Column({ nullable: true })
  machine: string;

  // СВЯЗЬ С ЗАКАЗОМ
  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
