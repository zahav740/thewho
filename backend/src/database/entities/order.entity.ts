/**
 * @file: order.entity.ts
 * @description: Entity для заказов (исправлено для внутренней совместимости)
 * @dependencies: typeorm
 * @created: 2025-01-28
 * @fixed: 2025-06-01 // Исправлена совместимость типов с DTO
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Operation } from './operation.entity';

export enum Priority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'drawing_number', type: 'varchar', length: 100, unique: true, nullable: true })
  drawingNumber: string;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer' })
  priority: number;

  @Column({ name: 'workType', type: 'varchar', length: 200, nullable: true })
  workType: string;

  @Column({ name: 'pdfPath', type: 'varchar', length: 500, nullable: true })
  pdfPath: string;

  // Дополнительные поля для совместимости (НЕ readonly!)
  // Они будут добавлены через enrichOrder, их не нужно объявлять здесь,
  // если они не являются колонками БД.
  name?: string;
  clientName?: string;
  remainingQuantity?: number;
  status?: string;
  completionPercentage?: number;
  forecastedCompletionDate?: Date;
  isOnSchedule?: boolean;
  lastRecalculationAt?: Date;
  pdfUrl?: string; // Объявляем как опциональное поле, которое будет добавлено

  // Связь с операциями - делаем явной
  @OneToMany(() => Operation, (operation) => operation.order, {
    cascade: true,
    eager: false
  })
  operations?: Operation[];

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}