## ⚠️ ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ

**Этот скрипт содержал ТЕСТОВЫЕ ДАННЫЕ, которые могли перезаписать ваш оригинальный Excel файл!**

Функция `directDatabaseExport()` была ОТКЛЮЧЕНА для предотвращения порчи данных.

### Что произошло:
1. Скрипт содержал хардкод-тестовые данные вместо чтения из БД
2. При запуске мог создать файлы с тестовыми данными
3. Возможно перезаписал ваш оригинальный Excel файл

### Что делать:
1. 🔍 Найдите оригинальный файл "תוכנית ייצור מאסטר 2025.xlsx"
2. 📋 Восстановите его из резервной копии или корзины
3. 🚫 НЕ запускайте EXPORT-ORDERS.bat до исправления
4. ✅ Используйте API методы для экспорта вместо прямого

---

#!/usr/bin/env node

/**
 * @file: export-orders-to-filesystem.js
 * @description: Скрипт для экспорта всех заказов из БД в файловую систему
 * @created: 2025-06-07
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Функция для экспорта заказов через API
async function exportOrdersToFileSystem() {
  console.log('🚀 Начинаем экспорт заказов из БД в файловую систему...\n');

  try {
    // Проверяем, что сервер запущен (можно адаптировать URL)
    const serverUrl = 'http://localhost:5100'; // Порт вашего backend
    
    console.log('📡 Отправляем запрос на экспорт...');
    
    // Используем curl для отправки запроса (можно заменить на fetch если используете Node.js 18+)
    const curlCommand = `curl -X POST "${serverUrl}/api/filesystem/orders/export-all" -H "Content-Type: application/json"`;
    
    const response = execSync(curlCommand, { encoding: 'utf8' });
    const result = JSON.parse(response);
    
    console.log('✅ Ответ сервера получен:');
    console.log('  Успешно экспортировано:', result.statistics?.success || 0);
    console.log('  Ошибок:', result.statistics?.errors || 0);
    console.log('  Сообщение:', result.message);
    
    // Проверяем результат
    if (result.success) {
      console.log('\n🎉 Экспорт завершен успешно!');
      
      // Показываем статистику файловой системы
      await showFileSystemStatistics(serverUrl);
    } else {
      console.log('\n❌ Экспорт завершен с ошибками');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при экспорте:', error.message);
    
    // Если сервер не запущен, пробуем прямой экспорт
    console.log('\n🔄 Пробуем альтернативный метод экспорта...');
    await directDatabaseExport();
  }
}

// Функция для получения статистики файловой системы
async function showFileSystemStatistics(serverUrl) {
  try {
    console.log('\n📊 Получаем статистику файловой системы...');
    
    const statsCommand = `curl -X GET "${serverUrl}/api/filesystem/orders/statistics/overview" -H "Content-Type: application/json"`;
    const statsResponse = execSync(statsCommand, { encoding: 'utf8' });
    const stats = JSON.parse(statsResponse);
    
    if (stats.success) {
      const s = stats.statistics;
      console.log('📈 Статистика файловой системы:');
      console.log(`  📦 Общее количество заказов: ${s.total_orders}`);
      console.log(`  📚 Общее количество версий: ${s.total_versions}`);
      console.log(`  📊 Среднее версий на заказ: ${s.average_versions_per_order}`);
      console.log(`  👥 Заказов с данными смен: ${s.orders_with_shifts} (${s.coverage.shifts_coverage})`);
      console.log(`  📅 Заказов с планированием: ${s.orders_with_planning} (${s.coverage.planning_coverage})`);
      console.log(`  📝 Заказов с историей: ${s.orders_with_history} (${s.coverage.history_coverage})`);
    }
  } catch (error) {
    console.log('⚠️  Не удалось получить статистику:', error.message);
  }
}

// Прямой экспорт из базы данных (если API недоступно)
async function directDatabaseExport() {
  console.log('📋 ВНИМАНИЕ: Функция прямого экспорта ОТКЛЮЧЕНА!');
  console.log('⚠️  Тестовые данные могут перезаписать оригинальные файлы');
  console.log('❌ Для предотвращения порчи данных функция заблокирована');
  console.log('');
  console.log('🔧 Если нужен экспорт из БД, используйте API метод:');
  console.log('   GET /api/orders - для получения списка заказов');
  console.log('   POST /api/filesystem/orders/export-all - для экспорта');
  console.log('');
  console.log('💡 Для восстановления функции удалите эту проверку из кода');
  
  return; // БЛОКИРУЕМ ВЫПОЛНЕНИЕ
  
  /* ЗАБЛОКИРОВАННЫЙ КОД С ТЕСТОВЫМИ ДАННЫМИ:
  console.log('📋 Выполняем прямой экспорт из базы данных...');
  
  const ordersPath = path.join(process.cwd(), 'uploads', 'orders');
  
  try {
    // Проверяем существование папки orders
    await fs.access(ordersPath);
    console.log('✅ Папка orders уже существует');
  } catch {
    await fs.mkdir(ordersPath, { recursive: true });
    console.log('✅ Создана папка orders');
  }
  
  // Получаем данные заказов из базы
  console.log('📡 Подключаемся к базе данных...');
  
  // !!! ЭТИ ДАННЫЕ ТЕСТОВЫЕ И МОГУТ ПЕРЕЗАПИСАТЬ ОРИГИНАЛЬНЫЕ !!!
  const sampleOrders = [
    {
      drawing_number: 'TH1K4108A',
      id: 7,
      quantity: 110,
      deadline: '2025-05-07T22:00:00.000Z',
      priority: 2,
      workType: 'фрезерная'
    },
    {
      drawing_number: 'C6HP0021A', 
      id: 8,
      quantity: 30,
      deadline: '2025-04-29T22:00:00.000Z',
      priority: 1,
      workType: ''
    },
    {
      drawing_number: 'G63828A',
      id: 13, 
      quantity: 20,
      deadline: '2025-03-30T22:00:00.000Z',
      priority: 3,
      workType: ''
    }
  ];
  
  for (const order of sampleOrders) {
    await createOrderFileStructure(order);
  }
  
  console.log('✅ Прямой экспорт завершен');
  */ // КОНЕЦ ЗАБЛОКИРОВАННОГО КОДА
}

// Создание файловой структуры для заказа
async function createOrderFileStructure(orderData) {
  const orderPath = path.join(process.cwd(), 'uploads', 'orders', orderData.drawing_number);
  const versionPath = path.join(orderPath, '2025-05-30');
  
  try {
    // Создаем структуру папок
    const folders = [
      versionPath,
      path.join(versionPath, 'operations'),
      path.join(versionPath, 'shifts'), 
      path.join(versionPath, 'planning'),
      path.join(versionPath, 'documents'),
      path.join(versionPath, 'history'),
      path.join(versionPath, 'exports')
    ];
    
    for (const folder of folders) {
      await fs.mkdir(folder, { recursive: true });
    }
    
    // Создаем основные файлы
    const orderJson = {
      ...orderData,
      createdAt: '2025-05-30T19:00:42.029Z',
      updatedAt: '2025-06-07T12:32:30.951Z',
      status: 'in_progress',
      completionPercentage: 25,
      isOnSchedule: false
    };
    
    const metadataJson = {
      version: '1.0',
      created_at: '2025-05-30T19:00:42.029Z',
      updated_at: '2025-06-07T12:32:30.951Z',
      changes_summary: 'Создание заказа при экспорте',
      data_source: 'direct_export',
      export_date: new Date().toISOString()
    };
    
    const operationsJson = [
      {
        id: 26,
        operationNumber: 1,
        estimatedTime: 120,
        status: 'PENDING',
        operationType: 'MILLING',
        machineAxes: 3
      }
    ];
    
    // Сохраняем файлы
    await fs.writeFile(
      path.join(versionPath, 'order.json'),
      JSON.stringify(orderJson, null, 2)
    );
    
    await fs.writeFile(
      path.join(versionPath, 'metadata.json'), 
      JSON.stringify(metadataJson, null, 2)
    );
    
    await fs.writeFile(
      path.join(versionPath, 'operations', 'operations.json'),
      JSON.stringify(operationsJson, null, 2)
    );
    
    console.log(`✅ Создана структура для заказа ${orderData.drawing_number}`);
    
  } catch (error) {
    console.error(`❌ Ошибка создания структуры для ${orderData.drawing_number}:`, error.message);
  }
}

// Функция для проверки статуса файловой системы
async function checkFileSystemStatus() {
  console.log('🔍 Проверяем состояние файловой системы заказов...\n');
  
  const ordersPath = path.join(process.cwd(), 'uploads', 'orders');
  
  try {
    const orderFolders = await fs.readdir(ordersPath);
    console.log(`📁 Найдено папок заказов: ${orderFolders.length}`);
    
    for (const orderFolder of orderFolders) {
      const orderPath = path.join(ordersPath, orderFolder);
      const stats = await fs.stat(orderPath);
      
      if (stats.isDirectory()) {
        const versions = await fs.readdir(orderPath);
        const versionFolders = [];
        
        for (const version of versions) {
          const versionPath = path.join(orderPath, version);
          const versionStats = await fs.stat(versionPath);
          if (versionStats.isDirectory() && /^\d{4}-\d{2}-\d{2}/.test(version)) {
            versionFolders.push(version);
          }
        }
        
        console.log(`  📦 ${orderFolder}: ${versionFolders.length} версий - [${versionFolders.join(', ')}]`);
      }
    }
    
  } catch (error) {
    console.log('📂 Папка orders не найдена или пуста');
  }
}

// Главная функция
async function main() {
  console.log('🏗️  Утилита экспорта заказов в файловую систему');
  console.log('===============================================\n');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'export';
  
  switch (command) {
    case 'export':
      await exportOrdersToFileSystem();
      break;
      
    case 'status':
      await checkFileSystemStatus();
      break;
      
    case 'direct':
      await directDatabaseExport();
      break;
      
    default:
      console.log('Доступные команды:');
      console.log('  export  - Экспортировать заказы через API (по умолчанию)');
      console.log('  status  - Проверить состояние файловой системы');
      console.log('  direct  - Прямой экспорт (если API недоступно)');
      console.log('\nПример: node export-orders-to-filesystem.js export');
  }
  
  console.log('\n✨ Готово!');
}

// Запуск скрипта
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  });
}

module.exports = {
  exportOrdersToFileSystem,
  checkFileSystemStatus,
  directDatabaseExport
};
