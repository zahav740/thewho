/**
 * @file: app.module.ts
 * @description: Корневой модуль приложения
 * @dependencies: все основные модули
 * @created: 2025-01-28
 * @updated: 2025-05-31 // Добавлен OrdersDataMiddleware для исправления ошибки 400
 */
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { MachinesModule } from './modules/machines/machines.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OperationsModule } from './modules/operations/operations.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { PlanningModule } from './modules/planning/planning.module';
import { TestModule } from './modules/test/test.module';
import { PetsModule } from './modules/pets/pets.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { OperationAnalyticsModule } from './modules/operation-analytics/operation-analytics.module';
import { SynchronizationModule } from './modules/synchronization/synchronization.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HeaderSizeMiddleware } from './common/middleware/header-size.middleware';
import { OrdersDataMiddleware } from './modules/orders/orders.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      // Глобальная конфигурация Multer для обработки файлов
      // НЕ сохраняем файлы на диск - работаем только с buffer в памяти
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB максимум
        files: 10, // максимум 10 файлов за раз
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'magarel',
      database: process.env.DB_NAME || 'thewho',
      entities: [__dirname + '/database/entities/*.entity{.ts,.js}', __dirname + '/modules/*/entities/*.entity{.ts,.js}'],
      synchronize: false, // Отключаем автоматическую синхронизацию, используем миграции
      logging: process.env.NODE_ENV === 'development',
      // Добавляем настройки для работы с существующей БД
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 3000,
    }),
    MachinesModule,
    OrdersModule,
    OperationsModule,
    OperatorsModule,
    ShiftsModule,
    CalendarModule,
    FilesModule,
    PlanningModule,
    HealthModule,
    TestModule,
    PetsModule,
    TranslationsModule, // Модуль переводов
    OperationAnalyticsModule, // Модуль аналитики операций
    SynchronizationModule, // 🆕 Модуль синхронизации Production ↔ Shifts
    AuthModule, // 🆕 Модуль аутентификации
  ],
  providers: [
    // Временно отключаем глобальный guard
    // Reflector,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeaderSizeMiddleware)
      .forRoutes('*');
      
    // Применяем OrdersDataMiddleware только к маршрутам заказов
    consumer
      .apply(OrdersDataMiddleware)
      .forRoutes('/api/orders', '/api/orders/:id');
  }
}
