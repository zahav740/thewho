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

// --- Конфигурации и Middleware ---
import { createDatabaseConfig } from './config/database.config';
import { HeaderSizeMiddleware } from './common/middleware/header-size.middleware';
import { StaticFilesMiddleware } from './common/middleware/static-files.middleware';
import { OrdersDataMiddleware } from './modules/orders/orders.middleware';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// --- Основные модули приложения ---
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
import { TranslationsModule } from './modules/translations/translations.module';
import { OperationAnalyticsModule } from './modules/operation-analytics/operation-analytics.module';
import { SynchronizationModule } from './modules/synchronization/synchronization.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExcelImportModule } from './modules/excel-import/excel-import.module';
import { ImprovedExcelImportModule } from './modules/excel-import/improved-excel-import.module';

@Module({
  imports: [
    // Глобальный модуль для работы с конфигурацией и .env файлами
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Глобальная настройка Multer для обработки загружаемых файлов
    MulterModule.register({
      // Работаем с файлами в памяти (buffer), а не сохраняем их на диск по умолчанию
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB максимум
        files: 10,                   // не более 10 файлов за один запрос
      },
    }),

    // Настройка подключения к базе данных.
    // Вся логика (включая SSL) вынесена в функцию createDatabaseConfig
    TypeOrmModule.forRoot(createDatabaseConfig()),

    // Подключение всех модулей вашего приложения
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
    TranslationsModule,
    OperationAnalyticsModule,
    SynchronizationModule,
    AuthModule,
    ExcelImportModule,
    ImprovedExcelImportModule,
  ],
  providers: [
    // В данный момент глобальный JWT Guard закомментирован.
    // Если вам понадобится включить защиту для всех эндпоинтов по умолчанию,
    // нужно будет раскомментировать эти строки.
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // Reflector, // Reflector нужен для работы гардов, если они включены
  ],
})
export class AppModule implements NestModule {
  // Настройка промежуточного ПО (Middleware)
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeaderSizeMiddleware)
      .forRoutes('*');
      
    consumer
      .apply(StaticFilesMiddleware)
      .forRoutes('*');
      
    consumer
      .apply(OrdersDataMiddleware)
      .forRoutes('/api/orders', '/api/orders/:id');
  }
}