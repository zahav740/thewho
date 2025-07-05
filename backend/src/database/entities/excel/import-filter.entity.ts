/**
 * @file: import-filter.entity.ts
 * @description: Entity для хранения настроек фильтров импорта
 * @created: 2025-06-30
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('import_filters')
export class ImportFilter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  filter_config: any;

  @Column({ length: 100 })
  target_table: string;

  @Column({ type: 'jsonb', nullable: true })
  column_mapping: any;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
