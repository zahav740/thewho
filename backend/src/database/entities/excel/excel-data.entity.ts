/**
 * @file: excel-data.entity.ts
 * @description: Entity для хранения данных из Excel файлов
 * @created: 2025-06-30
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ExcelImport } from './excel-import.entity';

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
}

@Entity('excel_data')
@Index(['excel_import_id', 'sheet_name', 'row_number'])
export class ExcelData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  excel_import_id: number;

  @Column({ length: 255, nullable: true })
  sheet_name: string;

  @Column()
  row_number: number;

  @Column({ length: 255 })
  column_name: string;

  @Column({ type: 'text', nullable: true })
  cell_value: string;

  @Column({
    type: 'enum',
    enum: DataType,
    default: DataType.STRING,
  })
  data_type: DataType;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ExcelImport, (excelImport) => excelImport.excel_data, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'excel_import_id' })
  excel_import: ExcelImport;
}
