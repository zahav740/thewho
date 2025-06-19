/**
 * @file: ormconfig.beget.ts
 * @description: Конфигурация TypeORM для Beget с Supabase
 * @dependencies: typeorm
 * @created: 2025-06-19
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT, 10) || 6543,
  username: process.env.DB_USERNAME || 'postgres.kukqacmzfmzepdfddppl',
  password: process.env.DB_PASSWORD || 'Magarel1!',
  database: process.env.DB_NAME || 'postgres',
  
  // SSL для Supabase (обязательно!)
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Настройки подключения для Supabase
  extra: {
    max: 10, // максимум подключений в пуле
    min: 1,  // минимум подключений в пуле
    idle_timeout: 20000,
    connection_timeout: 60000,
  },
  
  synchronize: false, // НИКОГДА не включать в продакшене
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: ['dist/src/**/*.entity{.ts,.js}'],
  migrations: ['dist/src/database/migrations/*{.ts,.js}'],
  subscribers: ['dist/src/database/subscribers/*{.ts,.js}'],
  
  // Опции для миграций
  migrationsRun: false, // Не запускать миграции автоматически
  migrationsTableName: 'migrations_history',
});

// Дополнительная проверка соединения
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}
