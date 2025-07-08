/**
 * @file: operator.entity.ts
 * @description: Entity для операторов
 * @created: 2025-07-01
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, default: 'PRODUCTION' })
  type: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  experience: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyrate: number;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @CreateDateColumn({ name: 'createdat' })
  createdat: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedat: Date;
}
