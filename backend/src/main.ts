/**
 * @file: main.ts
 * @description: Точка входа в приложение NestJS
 * @dependencies: app.module
 * @created: 2025-01-28
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuthService } from './modules/auth/auth.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения из соответствующего файла
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
} else {
  dotenv.config();
}

console.log('PRODUCTION BACKEND STARTING ON PORT', process.env.PORT || 5100, '...');
console.log('Database:', `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD?.substring(0, 3)}***@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
console.log('Environment:', process.env.NODE_ENV);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс для API
  app.setGlobalPrefix('api');

  // Включаем CORS с поддержкой localhost и production доменов
  app.enableCors({
    origin: [
      'http://localhost',
      'http://localhost:80', 
      'http://localhost:3000', // React dev server
      'http://localhost:3001', // Backend port
      'http://localhost:5100', // Production backend port
      'http://localhost:5101', // Production frontend port
      'https://kasuf.xyz', // Production domain
      'https://www.kasuf.xyz', // Production domain with www
      process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true, // Включаем для JWT cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 часа
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Production CRM API')
    .setDescription('API для управления производством')
    .setVersion('1.0')
    .addBearerAuth() // Добавляем поддержку JWT в Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Создаем админ пользователя при запуске
  const authService = app.get(AuthService);
  await authService.ensureAdminExists();

  const port = process.env.PORT || 5100; // 🔧 Используем порт 5100 по умолчанию
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API docs: http://localhost:${port}/api/docs`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}
bootstrap();
