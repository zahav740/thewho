/**
 * @file: machine.entity.ts
 * @description: Entity для станков
 * @dependencies: typeorm
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

export enum MachineType {
  MILLING = 'MILLING',
  TURNING = 'TURNING',
}

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // F1, F2, T1, T2...

  @Column({ type: 'varchar' })
  type: MachineType;

  @Column()
  axes: number; // 3 или 4 оси

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ name: 'isOccupied', default: false })
  isOccupied: boolean;

  @OneToMany(() => Operation, (operation) => operation.machine)
  operations: Operation[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
