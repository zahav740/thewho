/**
 * @file: pdf-file.entity.ts
 * @description: Entity для PDF файлов
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

@Entity('pdf_files')
export class PdfFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ name: 'preview_url', nullable: true })
  previewUrl: string;

  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}