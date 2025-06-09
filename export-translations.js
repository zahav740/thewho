/**
 * @file: export-translations.js
 * @description: Скрипт для экспорта переводов в JSON файлы
 * @created: 2025-01-28
 */

const fs = require('fs');
const path = require('path');

// Функция для определения рабочего порта
async function findApiPort() {
  const ports = [5100, 5101];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/translations/client`);
      if (response.ok) {
        console.log(`✅ Найден API на порту ${port}`);
        return port;
      }
    } catch (error) {
      // Порт недоступен, пробуем следующий
    }
  }
  
  throw new Error('Не удалось найти рабочий API на портах 5100 или 5101');
}

// Функция для экспорта переводов
async function exportTranslations() {
  try {
    console.log('🌐 Экспорт переводов...');
    
    // Определяем рабочий порт
    const apiPort = await findApiPort();
    
    // Получаем переводы с API
    const response = await fetch(`http://localhost:${apiPort}/api/translations/client`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const translations = await response.json();
    
    // Создаем директорию для экспорта
    const exportDir = path.join(__dirname, 'translations-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    // Экспортируем русские переводы
    const ruPath = path.join(exportDir, 'ru.json');
    fs.writeFileSync(ruPath, JSON.stringify(translations.ru, null, 2), 'utf8');
    console.log(`✅ Русские переводы экспортированы: ${ruPath}`);
    
    // Экспортируем английские переводы
    const enPath = path.join(exportDir, 'en.json');
    fs.writeFileSync(enPath, JSON.stringify(translations.en, null, 2), 'utf8');
    console.log(`✅ Английские переводы экспортированы: ${enPath}`);
    
    // Экспортируем объединенный файл
    const combinedPath = path.join(exportDir, 'translations.json');
    fs.writeFileSync(combinedPath, JSON.stringify(translations, null, 2), 'utf8');
    console.log(`✅ Объединенный файл экспортирован: ${combinedPath}`);
    
    // Статистика
    const ruCount = Object.keys(translations.ru).length;
    const enCount = Object.keys(translations.en).length;
    
    console.log(`\n📊 Статистика экспорта:`);
    console.log(`   Русских переводов: ${ruCount}`);
    console.log(`   Английских переводов: ${enCount}`);
    console.log(`   Общих ключей: ${Math.max(ruCount, enCount)}`);
    
    if (ruCount !== enCount) {
      console.log(`\n⚠️  Количество переводов не совпадает!`);
    }
    
    console.log(`\n✨ Экспорт завершен успешно!`);
    
  } catch (error) {
    console.error('❌ Ошибка при экспорте переводов:', error.message);
    process.exit(1);
  }
}

// Запускаем экспорт
exportTranslations();
