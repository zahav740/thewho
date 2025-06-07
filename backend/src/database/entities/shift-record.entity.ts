/**
 * @file: shift-record.entity.ts
 * @description: Entity для записей смен (ИСПРАВЛЕНО - правильные типы и трансформеры)
 * @dependencies: typeorm, operation.entity, machine.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлены трансформеры для decimal полей
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ValueTransformer,
} from 'typeorm';
import { Operation } from './operation.entity';
import { Machine } from './machine.entity';

export enum ShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

// Трансформер для преобразования decimal в number
const NumericTransformer: ValueTransformer = {
  from: (value: string) => value ? parseFloat(value) : null,
  to: (value: number) => value ? value.toString() : null,
};

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

  @Column({ 
    name: 'dayShiftTimePerUnit', 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: NumericTransformer
  })
  dayShiftTimePerUnit: number;

  @Column({ name: 'nightShiftQuantity', nullable: true })
  nightShiftQuantity: number;

  @Column({ name: 'nightShiftOperator', nullable: true })
  nightShiftOperator: string;

  @Column({ 
    name: 'nightShiftTimePerUnit', 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: NumericTransformer
  })
  nightShiftTimePerUnit: number;

  // ИСПРАВЛЕНО: поле в БД называется "drawingnumber", а не "drawingNumber"
  @Column({ name: 'drawingnumber', nullable: true })
  drawingNumber: string;

  @Column({ name: 'operationId', nullable: true })
  operationId: number;

  // ИСПРАВЛЕНО: поле может быть NULL в БД
  @Column({ name: 'machineId', nullable: true })
  machineId: number;

  @ManyToOne(() => Operation, { nullable: true })
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @ManyToOne(() => Machine, { nullable: true })
  @JoinColumn({ name: 'machineId' })
  machine: Machine;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
