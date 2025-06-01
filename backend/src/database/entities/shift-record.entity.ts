/**
 * @file: shift-record.entity.ts
 * @description: Entity для записей смен
 * @dependencies: typeorm, operation.entity, machine.entity
 * @created: 2025-01-28
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
import { Operation } from './operation.entity';
import { Machine } from './machine.entity';

export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

@Entity('shift_records')
export class ShiftRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('date')
  date: Date;

  @Column({ name: 'shiftType' })
  shiftType: string;

  @Column({ name: 'setupTime', nullable: true })
  setupTime: number;

  @Column({ name: 'dayShiftQuantity', nullable: true })
  dayShiftQuantity: number;

  @Column({ name: 'dayShiftOperator', nullable: true })
  dayShiftOperator: string;

  @Column({ name: 'dayShiftTimePerUnit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  dayShiftTimePerUnit: number;

  @Column({ name: 'nightShiftQuantity', nullable: true })
  nightShiftQuantity: number;

  @Column({ name: 'nightShiftOperator', default: 'Аркадий' })
  nightShiftOperator: string;

  @Column({ name: 'nightShiftTimePerUnit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  nightShiftTimePerUnit: number;

  @ManyToOne(() => Operation, (operation) => operation.shiftRecords)
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @ManyToOne(() => Machine)
  @JoinColumn({ name: 'machineId' })
  machine: Machine;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
