/**
 * @file: pet.entity.ts
 * @description: Entity для объявлений о домашних животных
 * @dependencies: TypeORM
 * @created: 2025-05-30
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PetType {
  LOST = 'lost',
  FOUND = 'found'
}

export enum PetStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum AnimalSize {
  SMALL = 'small',
  MEDIUM = 'medium', 
  LARGE = 'large'
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PetType,
    default: PetType.LOST
  })
  type: PetType;

  @Column({
    type: 'enum',
    enum: PetStatus,
    default: PetStatus.ACTIVE
  })
  status: PetStatus;

  @Column()
  animalType: string; // собака, кошка, птица и т.д.

  @Column({ nullable: true })
  breed?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  age?: number;

  @Column({
    type: 'enum',
    enum: AnimalSize,
    nullable: true
  })
  size?: AnimalSize;

  // Геолокационные данные
  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  lastSeenLatitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  lastSeenLongitude?: number;

  @Column({ nullable: true })
  lastSeenAddress?: string;

  // Контактная информация
  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ default: 'both' })
  preferredContact: string; // phone, email, both

  // Изображения
  @Column('text', { array: true, default: [] })
  images: string[];

  // Вознаграждение
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  reward?: number;

  // Пользователь (пока простое поле, потом можно связать с User entity)
  @Column()
  userId: string;

  @Column()
  userName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
