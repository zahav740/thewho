/**
 * @file: file-hash.entity.ts
 * @description: Entity для хранения хешей загруженных файлов и предотвращения дубликатов
 * @dependencies: typeorm
 * @created: 2025-06-24
 * @updated: 2025-07-07 - Приведено в соответствие со схемой БД
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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_hash', type: 'varchar', length: 32, unique: true })
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

  @Column({ name: 'drawing_number', type: 'varchar', length: 100 })
  drawingNumber: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
