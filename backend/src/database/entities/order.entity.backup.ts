/**
 * @file: order.entity.ts
 * @description: Entity для заказов
 * @dependencies: typeorm, operation.entity
 * @created: 2025-01-28
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

  @Column({ name: 'drawing_number', unique: true, nullable: true })
  drawingNumber: string;

  @Column()
  quantity: number;

  @Column('date')
  deadline: Date;

  @Column()
  priority: number;

  @Column({ name: 'workType', nullable: true })
  workType: string;

  @Column({ name: 'pdfPath', nullable: true })
  pdfPath: string;

  @OneToMany(() => Operation, (operation) => operation.order, {
    cascade: true,
  })
  operations: Operation[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
