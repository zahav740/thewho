/**
 * @file: create-test-excel.js
 * @description: Создание тестового Excel файла для проверки импорта
 */
const ExcelJS = require('exceljs');
const path = require('path');

async function createTestExcelFile() {
  console.log('📊 Создание тестового Excel файла...');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Тестовые данные');

  // Заголовки
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Название', key: 'name', width: 30 },
    { header: 'Описание', key: 'description', width: 50 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Цена', key: 'price', width: 15 },
    { header: 'Дата создания', key: 'created_at', width: 20 },
    { header: 'Статус', key: 'status', width: 15 },
  ];

  // Тестовые данные
  const testData = [
    { id: 1, name: 'Товар 1', description: 'Описание товара 1', quantity: 100, price: 1500.50, created_at: '2025-07-01', status: 'Активен' },
    { id: 2, name: 'Товар 2', description: 'Описание товара 2', quantity: 50, price: 2300.00, created_at: '2025-07-02', status: 'Неактивен' },
    { id: 3, name: 'Товар 3', description: 'Описание товара 3', quantity: 75, price: 800.25, created_at: '2025-07-03', status: 'Активен' },
    { id: 4, name: 'Товар 4', description: 'Описание товара 4', quantity: 200, price: 450.00, created_at: '2025-07-04', status: 'Активен' },
    { id: 5, name: 'Товар 5', description: 'Описание товара 5', quantity: 25, price: 3200.75, created_at: '2025-07-05', status: 'Неактивен' },
  ];

  // Добавляем данные в таблицу
  testData.forEach(row => {
    worksheet.addRow(row);
  });

  // Стилизация заголовков
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Добавляем границы для всех ячеек
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  // Сохраняем файл
  const filename = 'test-excel-data.xlsx';
  const filepath = path.join(__dirname, filename);
  
  await workbook.xlsx.writeFile(filepath);
  
  console.log(`✅ Тестовый Excel файл создан: ${filepath}`);
  console.log(`📊 Данных: ${testData.length} строк, ${worksheet.columns.length} колонок`);
  
  return filepath;
}

// Создаем также файл с большим количеством данных для тестирования производительности
async function createLargeTestExcelFile() {
  console.log('📊 Создание большого тестового Excel файла...');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Большие данные');

  // Заголовки
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Название', key: 'name', width: 30 },
    { header: 'Категория', key: 'category', width: 20 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Цена', key: 'price', width: 15 },
    { header: 'Дата', key: 'date', width: 20 },
    { header: 'Статус', key: 'status', width: 15 },
    { header: 'Комментарий', key: 'comment', width: 50 },
  ];

  // Генерируем 1000 строк тестовых данных
  const categories = ['Электроника', 'Одежда', 'Книги', 'Спорт', 'Дом и сад'];
  const statuses = ['Активен', 'Неактивен', 'Ожидает', 'Архив'];
  
  for (let i = 1; i <= 1000; i++) {
    const row = {
      id: i,
      name: `Товар ${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      quantity: Math.floor(Math.random() * 1000) + 1,
      price: Math.round((Math.random() * 10000 + 100) * 100) / 100,
      date: new Date(2025, 6, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      comment: `Комментарий для товара ${i}. Это тестовые данные для проверки производительности.`
    };
    
    worksheet.addRow(row);
  }

  // Стилизация заголовков
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4E6F1' }
    };
  });

  // Сохраняем файл
  const filename = 'test-excel-large-data.xlsx';
  const filepath = path.join(__dirname, filename);
  
  await workbook.xlsx.writeFile(filepath);
  
  console.log(`✅ Большой тестовый Excel файл создан: ${filepath}`);
  console.log(`📊 Данных: 1000 строк, ${worksheet.columns.length} колонок`);
  
  return filepath;
}

// Запуск создания файлов
async function main() {
  try {
    await createTestExcelFile();
    await createLargeTestExcelFile();
    console.log('\n🎉 Все тестовые файлы созданы успешно!');
  } catch (error) {
    console.error('❌ Ошибка создания файлов:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTestExcelFile, createLargeTestExcelFile };
