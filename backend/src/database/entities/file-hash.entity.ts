/**
 * @file: file-hash.entity.ts
 * @description: Entity для хранения хешей загруженных файлов и предотвращения дубликатов
 * @dependencies: typeorm
 * @created: 2025-06-24
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

@Entity('file_hashes')
export class FileHash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 64, unique: true })
  fileHash: string;

  @Column({ name: 'filename', type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
