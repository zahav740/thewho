/**
 * @file: test.module.ts
 * @description: Тестовый модуль для диагностики
 * @dependencies: TypeOrmModule
 * @created: 2025-05-28
 */
import { Module } from '@nestjs/common';
import { TestController } from './test.controller';

@Module({
  controllers: [TestController],
})
export class TestModule {}
