/**
 * @file: ormconfig.ts
 * @description: Конфигурация TypeORM
 * @dependencies: typeorm
 * @created: 2025-01-28
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'magarel',
  database: process.env.DB_NAME || 'thewho',
  synchronize: false, // Отключаем, чтобы не пересоздавать таблицы
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  subscribers: ['src/database/subscribers/*{.ts,.js}'],
});
