/**
 * @file: operation.entity.ts
 * @description: Entity для операций производства
 * @dependencies: typeorm, order.entity, machine.entity
 * @created: 2025-01-28
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
  id: number;

  @Column({ name: 'operationNumber' })
  operationNumber: number;

  @Column({ name: 'estimatedTime' })
  estimatedTime: number; // в минутах

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ name: 'operationtype', type: 'varchar', nullable: true })
  operationType: OperationType;

  @Column({ name: 'machineaxes', nullable: true })
  machineAxes: number;

  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Machine, (machine) => machine.operations, {
    nullable: true,
  })
  @JoinColumn({ name: 'machineId' })
  machine: Machine;

  @OneToMany(() => ShiftRecord, (shiftRecord) => shiftRecord.operation)
  shiftRecords: ShiftRecord[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
