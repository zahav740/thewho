/**
 * @file: operation-progress.entity.ts
 * @description: Entity для прогресса операций
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
import { Order } from './order.entity';

@Entity('operation_progress')
export class OperationProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'calculation_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculationDate: Date;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'deadline', type: 'timestamp' })
  deadline: Date;

  @Column({ name: 'estimated_completion_date', type: 'timestamp', nullable: true })
  estimatedCompletionDate: Date;

  @Column()
  quantity: number;

  @Column({ name: 'total_production_time' })
  totalProductionTime: number; // в минутах

  @Column({ name: 'total_setup_time' })
  totalSetupTime: number; // в минутах

  @Column({ name: 'total_required_time' })
  totalRequiredTime: number; // в минутах

  @Column({ name: 'required_workdays' })
  requiredWorkdays: number;

  @Column({ name: 'will_meet_deadline' })
  willMeetDeadline: boolean;

  @Column({ name: 'time_margin' })
  timeMargin: number; // в минутах (может быть отрицательным)

  @Column({ type: 'jsonb' })
  operations: any[]; // JSON массив операций

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}