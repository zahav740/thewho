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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс для API
  app.setGlobalPrefix('api');

  // Включаем CORS с поддержкой всех портов localhost
  app.enableCors({
    origin: [
      'http://localhost',
      'http://localhost:80', 
      'http://localhost:3000', // React dev server
      'http://localhost:3001', // Backend port
      'http://localhost:5100', // Production port
      'http://localhost:5101'  // Alternative port
    ],
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001; // 🔧 Используем порт 3001 по умолчанию
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger API docs: http://localhost:${port}/api/docs`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}
bootstrap();
