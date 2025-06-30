/**
 * @file: pdf-revision.entity.ts
 * @description: Entity для хранения ревизий PDF файлов заказов
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

@Entity('pdf_revisions')
export class PdfRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'revision_number', type: 'integer' })
  revisionNumber: number;

  @Column({ name: 'filename', type: 'varchar', length: 255 })
  filename: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'file_hash', type: 'varchar', length: 64 })
  fileHash: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
