/**
 * @file: database.config.ts
 * @description: Конфигурация базы данных с поддержкой Supabase
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env.production') });
} else {
  dotenv.config();
}

export function createDatabaseConfig(): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
  
  console.log('🔧 Настройка подключения к базе данных...');
  console.log('🌍 Режим:', isProduction ? 'production' : 'development');
  console.log('🏠 Локальная БД:', isLocal ? 'да' : 'нет');
  
  // Если это локальная база данных
  if (isLocal) {
    console.log('📡 Подключение к локальной PostgreSQL...');
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'magarel',
      database: process.env.DB_NAME || 'thewho',
      entities: [__dirname + '/../database/entities/*.entity{.ts,.js}', __dirname + '/../modules/*/entities/*.entity{.ts,.js}'],
      synchronize: false,
      logging: isProduction ? false : true,
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 3000,
      // Для локальной БД SSL не нужен
      ssl: false,
      extra: {
        max: 10,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },
    };
  }
  
  // Для удаленных баз данных (Supabase и др.)
  if (isProduction) {
    console.log('📡 Подключение к удаленной базе данных...');
    
    // Вариант 1: Прямое подключение через url
    if (process.env.DATABASE_URL) {
      console.log('🔗 Используем DATABASE_URL для подключения');
      return {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [__dirname + '/../database/entities/*.entity{.ts,.js}', __dirname + '/../modules/*/entities/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
        autoLoadEntities: true,
        retryAttempts: 5,
        retryDelay: 3000,
        ssl: {
          rejectUnauthorized: false,
        },
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
          max: 20,
          connectionTimeoutMillis: 60000,
          idleTimeoutMillis: 60000,
        },
      };
    }
    
    // Вариант 2: Обычные параметры для удаленной БД
    console.log('⚙️ Используем отдельные параметры подключения');
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../database/entities/*.entity{.ts,.js}', __dirname + '/../modules/*/entities/*.entity{.ts,.js}'],
      synchronize: false,
      logging: false,
      autoLoadEntities: true,
      retryAttempts: 5,
      retryDelay: 3000,
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
        max: 20,
        connectionTimeoutMillis: 60000,
        idleTimeoutMillis: 60000,
      },
    };
  }
  
  // Для разработки - локальная база
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'magarel',
    database: process.env.DB_NAME || 'thewho',
    entities: [__dirname + '/../database/entities/*.entity{.ts,.js}', __dirname + '/../modules/*/entities/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
    autoLoadEntities: true,
    retryAttempts: 3,
    retryDelay: 3000,
  };
}
