/**
 * Тестовая проверка TypeScript ошибок
 */

// Проверяем импорт нового контроллера
try {
  const { OperationCompletionController } = require('./src/modules/operations/operation-completion.controller');
  console.log('✅ OperationCompletionController импортируется успешно');
} catch (error) {
  console.error('❌ Ошибка импорта OperationCompletionController:', error.message);
}

// Проверяем модуль операций
try {
  const { OperationsModule } = require('./src/modules/operations/operations.module');
  console.log('✅ OperationsModule импортируется успешно');
} catch (error) {
  console.error('❌ Ошибка импорта OperationsModule:', error.message);
}

console.log('Проверка завершена');
