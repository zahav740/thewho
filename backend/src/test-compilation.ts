import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Тестовый файл для проверки компиляции
export async function testCompilation() {
  console.log('Тестируем компиляцию...');
  // Проверяем импорты
  const { ExcelProductionLoaderService } = await import('./modules/orders/excel-production-loader.service');
  const { OrdersController } = await import('./modules/orders/orders.controller');
  
  console.log('✅ Все модули успешно импортированы');
  
  return {
    ExcelProductionLoaderService,
    OrdersController
  };
}

if (require.main === module) {
  testCompilation().catch(console.error);
}
