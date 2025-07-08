/**
 * @file: pdf-revision.entity.ts
 * @description: Entity для хранения ревизий PDF файлов заказов
 * @dependencies: typeorm
 * @created: 2025-06-24
 * @updated: 2025-07-07 - Приведено в соответствие со схемой БД
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('pdf_revisions')
export class PdfRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'revision_number', type: 'integer', default: 1 })
  revisionNumber: number;

  @Column({ name: 'filename', type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'file_hash', type: 'varchar', length: 32, nullable: true })
  fileHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
