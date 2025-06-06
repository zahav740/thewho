/**
 * @file: machine.entity.ts
 * @description: Entity для станков (ИСПРАВЛЕНО для работы с текущим Operation)
 * @dependencies: typeorm
 * @created: 2025-01-28
 * @fixed: 2025-06-07 // Убрана ссылка на несуществующее machineEntity
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  type: string;

  @Column()
  axes: number; // 3 или 4 оси

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ name: 'isOccupied', default: false })
  isOccupied: boolean;

  // УБРАНА СВЯЗЬ С ОПЕРАЦИЯМИ - она не используется в текущей системе
  // @OneToMany(() => Operation, (operation) => operation.machineEntity, { nullable: true })
  // operations: Operation[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
