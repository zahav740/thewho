/**
 * @file: operation.entity.ts
 * @description: Entity для операций (СООТВЕТСТВУЕТ РЕАЛЬНОЙ БД СТРУКТУРЕ)
 * @dependencies: typeorm, order.entity, machine.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 // Приведено в соответствие с реальной БД
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

  // ИСПОЛЬЗУЕМ РЕАЛЬНЫЕ ИМЕНА ПОЛЕЙ ИЗ БД
  @Column({ name: 'operation_number' }) // После переименования из operationNumber
  operationNumber: number;

  // Алиас для обратной совместимости
  get sequenceNumber(): number {
    return this.operationNumber;
  }

  @Column({ name: 'operation_type', nullable: true }) // После переименования из operationtype
  operationType: string;

  @Column({ name: 'estimated_time' }) // После переименования из estimatedTime
  estimatedTime: number;

  @Column({ name: 'machine_axes', nullable: true }) // После переименования из machineaxes
  machineAxes: number;

  @Column({ default: 'PENDING' })
  status: string;

  // Дополнительные поля
  @Column({ nullable: true })
  machine: string;

  @Column({ name: 'completed_units', default: 0, nullable: true })
  completedUnits: number;

  @Column({ name: 'actual_time', nullable: true })
  actualTime: number;

  @Column({ type: 'jsonb', default: '[]', nullable: true })
  operators: any[];

  // СВЯЗЬ С ЗАКАЗОМ через order_id (после переименования из orderId)
  @ManyToOne(() => Order, (order) => order.operations, {
    onDelete: 'CASCADE', 
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Связь с машиной (опционально)
  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machineId' }) // Это поле пока остается как есть
  machineEntity: Machine;

  @OneToMany(() => ShiftRecord, (shiftRecord) => shiftRecord.operation, { nullable: true })
  shiftRecords: ShiftRecord[];

  @CreateDateColumn({ name: 'created_at' }) // После переименования из createdAt
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // После переименования из updatedAt
  updatedAt: Date;
}
