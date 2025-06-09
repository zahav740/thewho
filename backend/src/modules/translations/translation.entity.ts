/**
 * @file: translation.entity.ts
 * @description: Сущность для переводов
 * @created: 2025-01-28
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column('text')
  ru: string;

  @Column('text')
  en: string;

  @Column({ default: 'general' })
  category: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
