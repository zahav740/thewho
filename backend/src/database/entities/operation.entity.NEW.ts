/**
 * @file: operation.entity.ts
 * @description: Entity для операций производства (ИСПРАВЛЕНО ДЛЯ ПРОДАКШЕНА)
 * @dependencies: typeorm, order.entity, machine.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 // Исправлена структура полей для реальной БД
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Machine } from './machine.entity';
import { ShiftRecord } from './shift-record.entity';

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
  id: number; // Изменено с string на number

  @Column({ name: 'operation_number' })
  operationNumber: number;

  // Алиас для обратной совместимости
  get sequenceNumber(): number {
    return this.operationNumber;
  }

  @Column({ nullable: true })
  machine: string; // Название станка как строка

  // Связь с Machine entity (опционально)
  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machine_id' })
  machineEntity: Machine;

  @Column({ name: 'operation_type', type: 'varchar', nullable: true })
  operationType: string;

  @Column({ name: 'estimated_time' })
  estimatedTime: number; // в минутах

  @Column({ name: 'machine_axes', nullable: true })
  machineAxes: number;

  @Column({ name: 'completed_units', default: 0, nullable: true })
  completedUnits: number;

  @Column({ name: 'actual_time', nullable: true })
  actualTime: number;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'jsonb', default: '[]', nullable: true })
  operators: any[];

  // ИСПРАВЛЕНО: правильная связь с Order
  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'order_id' }) // Используем order_id как в БД
  order: Order;

  @OneToMany(() => ShiftRecord, (shiftRecord) => shiftRecord.operation, { nullable: true })
  shiftRecords: ShiftRecord[];

  @CreateDateColumn({ name: 'created_at', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
}
