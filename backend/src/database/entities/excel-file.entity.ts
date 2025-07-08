/**
 * @file: excel-file.entity.ts
 * @description: Сущность для хранения Excel файлов в базе данных
 * @created: 2025-07-02
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('excel_files')
@Index(['originalName'])
@Index(['createdAt'])
@Index(['status'])
export class ExcelFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 64 })
  fileHash: string; // MD5 хеш для дедупликации

  @Column({ type: 'bytea' })
  fileData: Buffer;

  @Column({ type: 'json', nullable: true })
  headers: string[];

  @Column({ type: 'text', nullable: true })
  parsedData: string; // JSON строка с данными

  @Column({ type: 'int', default: 0 })
  rowsCount: number;

  @Column({ type: 'int', default: 0 })
  sheetsCount: number;

  @Column({ 
    type: 'enum', 
    enum: ['uploading', 'parsed', 'error', 'processing'],
    default: 'uploading'
  })
  status: 'uploading' | 'parsed' | 'error' | 'processing';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  uploadedBy: string; // ID пользователя или имя

  @Column({ type: 'json', nullable: true })
  metadata: any; // Дополнительные метаданные

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Методы для работы с данными
  getParsedDataAsJson(): any[] {
    if (!this.parsedData) return [];
    try {
      return JSON.parse(this.parsedData);
    } catch {
      return [];
    }
  }

  setParsedData(data: any[]): void {
    this.parsedData = JSON.stringify(data);
    this.rowsCount = data.length;
  }

  getFileInfo() {
    return {
      id: this.id,
      originalName: this.originalName,
      description: this.description,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      rowsCount: this.rowsCount,
      sheetsCount: this.sheetsCount,
      status: this.status,
      uploadedBy: this.uploadedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
