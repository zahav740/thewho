/**
 * @file: machine-availability.entity.ts
 * @description: Entity для доступности станков (адаптирована под существующую БД)
 * @dependencies: typeorm
 * @created: 2025-05-28
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

export enum MachineType {
  MILLING_3AXIS = 'milling-3axis',
  MILLING_4AXIS = 'milling-4axis', 
  TURNING = 'turning',
}

@Entity('machine_availability')
export class MachineAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'machine_name', unique: true })
  machineName: string;

  @Column({ name: 'machine_type', type: 'varchar' })
  machineType: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'current_operation_id', type: 'varchar', nullable: true })
  currentOperationId: string;

  @ManyToOne(() => Operation, { nullable: true })
  @JoinColumn({ name: 'current_operation_id' })
  currentOperation: Operation;

  @Column({ name: 'last_freed_at', type: 'timestamp', nullable: true })
  lastFreedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Логика совместимости операций со станками
  canPerformOperation(operationType: string): boolean {
    switch (operationType) {
      case '3-axis':
        return ['milling-3axis', 'milling-4axis'].includes(this.machineType);
      case '4-axis':
        return this.machineType === 'milling-4axis';
      case 'turning':
        return this.machineType === 'turning';
      default:
        return false;
    }
  }

  // Получение человекочитаемого названия типа станка
  getTypeLabel(): string {
    switch (this.machineType) {
      case 'milling-4axis':
        return 'Фрезерный 3-4 оси';
      case 'milling-3axis':
        return 'Фрезерный 3 оси';
      case 'turning':
        return 'Токарный';
      default:
        return this.machineType;
    }
  }
}