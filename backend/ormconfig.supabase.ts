import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения
if (process.env.NODE_ENV === 'production') {
  config({ path: path.join(__dirname, '..', '.env.supabase.production') });
} else {
  config();
}

export const SupabaseDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT) || 6543,
  username: process.env.DB_USERNAME || 'postgres.kukqacmzfmzepdfddppl',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  
  // Supabase требует SSL соединения
  ssl: {
    rejectUnauthorized: false
  },
  
  // Настройки пула соединений для Supabase
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    acquireConnectionTimeout: parseInt(process.env.DB_TIMEOUT) || 30000,
    timeout: parseInt(process.env.DB_TIMEOUT) || 30000,
    // Важно для Supabase Pooler
    poolMode: process.env.DB_POOL_MODE || 'transaction',
  },

  // Автоматическая синхронизация только в разработке
  synchronize: process.env.NODE_ENV !== 'production',
  
  // Логирование запросов в разработке
  logging: process.env.NODE_ENV !== 'production' ? 'all' : ['error'],
  
  // Сущности
  entities: [
    process.env.NODE_ENV === 'production' 
      ? 'dist/**/*.entity.js'
      : 'src/**/*.entity.ts'
  ],
  
  // Миграции
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts'
  ],
  
  // Подписчики
  subscribers: [
    process.env.NODE_ENV === 'production'
      ? 'dist/subscribers/*.js'
      : 'src/subscribers/*.ts'
  ],

  // Настройки миграций
  migrationsRun: false, // Не запускать автоматически в продакшене
  migrationsTableName: 'typeorm_migrations',
});

// Экспорт конфигурации для использования в приложении
export const supabaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT) || 6543,
  username: process.env.DB_USERNAME || 'postgres.kukqacmzfmzepdfddppl',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  ssl: {
    rejectUnauthorized: false
  },
  extra: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    acquireConnectionTimeout: parseInt(process.env.DB_TIMEOUT) || 30000,
    timeout: parseInt(process.env.DB_TIMEOUT) || 30000,
    poolMode: process.env.DB_POOL_MODE || 'transaction',
  },
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production' ? 'all' : ['error'],
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 3000,
};

export default SupabaseDataSource;
