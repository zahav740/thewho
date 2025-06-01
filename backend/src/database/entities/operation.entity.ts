/**
 * @file: operation.entity.ts
 * @description: Entity для операций производства (исправлено для существующей БД)
 * @dependencies: typeorm, order.entity, machine.entity
 * @created: 2025-01-28
 * @fixed: 2025-05-28
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_number' })
  sequenceNumber: number;

  // Для обратной совместимости с старым кодом
  get operationNumber(): number {
    return this.sequenceNumber;
  }

  @Column({ nullable: true })
  machine: string;

  // Отдельное поле для связи с Machine entity
  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machine_id' })
  machineEntity: Machine;

  @Column({ name: 'operation_type', type: 'varchar', nullable: true })
  operationType: string;

  @Column({ name: 'estimated_time' })
  estimatedTime: number; // в минутах

  @Column({ name: 'completed_units', default: 0 })
  completedUnits: number;

  @Column({ name: 'actual_time', nullable: true })
  actualTime: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', default: '[]' })
  operators: any[];

  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToMany(() => ShiftRecord, (shiftRecord) => shiftRecord.operation)
  shiftRecords: ShiftRecord[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
