/**
 * @file: main.ts
 * @description: Точка входа в приложение NestJS - Beget Production
 * @dependencies: app.module
 * @created: 2025-01-28
 * @updated: 2025-06-19 - для деплоя на Beget
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс для API
  app.setGlobalPrefix('api');

  // CORS конфигурация для продакшена на Beget
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://kasuf.xyz',
        'https://www.kasuf.xyz',
        'http://kasuf.xyz',
        'http://www.kasuf.xyz'
      ]
    : [
        'http://localhost',
        'http://localhost:80', 
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5100',
        'http://localhost:5101',
        'https://kasuf.xyz'
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Accept', 
      'Authorization', 
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
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

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // Настройка Swagger только для разработки
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Production CRM API')
      .setDescription('API для управления производством')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Порт для Beget (5100 для продакшена)
  const port = process.env.PORT || 5100;
  await app.listen(port, '0.0.0.0'); // Слушаем на всех интерфейсах
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🔧 Health check: http://localhost:${port}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 Swagger API docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch(error => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
