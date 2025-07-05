/**
 * @file: excel-import.entity.ts
 * @description: Entity для хранения информации о загруженных Excel файлах
 * @created: 2025-06-30
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ExcelData } from './excel-data.entity';

export enum ImportStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing', 
  PROCESSED = 'processed',
  ERROR = 'error',
}

@Entity('excel_imports')
export class ExcelImport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  original_filename: string;

  @Column({ length: 500, nullable: true })
  file_path: string;

  @Column({ nullable: true })
  file_size: number;

  @Column({ length: 100, nullable: true })
  mimetype: string;

  @CreateDateColumn()
  upload_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_date: Date;

  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.UPLOADED,
  })
  status: ImportStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ nullable: true })
  headers_count: number;

  @Column({ nullable: true })
  rows_count: number;

  @Column({ nullable: true })
  sheets_count: number;

  @Column({ type: 'jsonb', nullable: true })
  data_preview: any;

  @Column({ default: false })
  imported_to_orders: boolean;

  @Column({ default: false })
  imported_to_operations: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ExcelData, (excelData) => excelData.excel_import)
  excel_data: ExcelData[];
}
