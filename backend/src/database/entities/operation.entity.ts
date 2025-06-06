/**
 * @file: operation.entity.ts
 * @description: Entity РАБОТАЮЩИЙ с текущей БД (без изменений структуры)
 * @dependencies: typeorm, order.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 // Соответствует существующей БД БЕЗ переименований
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

  // ИСПОЛЬЗУЕМ ТОЧНЫЕ ИМЕНА ИЗ СУЩЕСТВУЮЩЕЙ БД
  @Column({ name: 'operationNumber' }) // Точно как в БД
  operationNumber: number;

  // Алиас для совместимости
  get sequenceNumber(): number {
    return this.operationNumber;
  }

  @Column({ name: 'operationtype', nullable: true }) // Точно как в БД
  operationType: string;

  @Column({ name: 'estimatedTime' }) // Точно как в БД
  estimatedTime: number;

  @Column({ name: 'machineaxes', nullable: true }) // Точно как в БД
  machineAxes: number;

  @Column({ default: 'PENDING' })
  status: string;

  // СВЯЗЬ С ЗАКАЗОМ - используем существующее поле orderId
  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'orderId' }) // Используем существующее поле
  order: Order;

  @CreateDateColumn({ name: 'createdAt' }) // Точно как в БД
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' }) // Точно как в БД  
  updatedAt: Date;
}
