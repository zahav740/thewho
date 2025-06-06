/**
 * @file: app.module.sqlite.ts
 * @description: Конфигурация с SQLite вместо PostgreSQL
 * @dependencies: typeorm, sqlite3
 * @created: 2025-05-27
 */
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesModule } from './modules/machines/machines.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { FilesModule } from './modules/files/files.module';
import { HeaderSizeMiddleware } from './common/middleware/header-size.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'production_crm.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Для SQLite можем использовать синхронизацию
      logging: process.env.NODE_ENV === 'development',
    }),
    MachinesModule,
    OrdersModule,
    OperationsModule,
    ShiftsModule,
    CalendarModule,
    FilesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeaderSizeMiddleware)
      .forRoutes('*');
  }
}
