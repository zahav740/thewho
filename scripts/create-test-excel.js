const fs = require('fs');
const ExcelJS = require('exceljs');
const path = require('path');

async function createTestExcelFile() {
  console.log('📊 Создаем демонстрационный Excel файл...');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');
  
  // Заголовки (смешанные русские и английские для проверки маппинга)
  worksheet.columns = [
    { header: 'Номер чертежа', key: 'drawing_number', width: 20 },
    { header: 'Количество', key: 'quantity', width: 15 },
    { header: 'Deadline', key: 'deadline', width: 15 },
    { header: 'Приоритет', key: 'priority', width: 15 },
    { header: 'Work Type', key: 'workType', width: 20 },
    { header: 'Статус', key: 'status', width: 15 }
  ];
  
  // Тестовые данные
  const testOrders = [
    {
      drawing_number: 'DRW-001',
      quantity: 10,
      deadline: new Date('2025-07-15'),
      priority: 'высокий',
      workType: 'Фрезерование',
      status: 'planned'
    },
    {
      drawing_number: 'DRW-002', 
      quantity: 25,
      deadline: new Date('2025-07-20'),
      priority: 'средний',
      workType: 'Токарные работы',
      status: 'planned'
    },
    {
      drawing_number: 'DRW-003',
      quantity: 5,
      deadline: new Date('2025-07-10'),
      priority: 'критический',
      workType: 'Сверление',
      status: 'planned'
    },
    {
      drawing_number: 'DRW-004',
      quantity: 15,
      deadline: new Date('2025-07-25'),
      priority: 'низкий',
      workType: 'Шлифовка',
      status: 'planned'
    },
    {
      drawing_number: 'PART-005',
      quantity: 30,
      deadline: new Date('2025-08-01'),
      priority: 'medium',
      workType: 'Milling',
      status: 'planned'
    }
  ];
  
  // Добавляем данные
  testOrders.forEach(order => {
    worksheet.addRow(order);
  });
  
  // Стилизация заголовков
  worksheet.getRow(1).eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Стилизация данных
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    worksheet.getRow(rowNum).eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  // Сохраняем файл
  const fileName = 'test-orders-excel-import.xlsx';
  const filePath = path.join(__dirname, '..', fileName);
  
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Демонстрационный файл создан: ${fileName}`);
  console.log(`📍 Путь: ${filePath}`);
  
  return filePath;
}

// Создаем также английскую версию
async function createTestExcelFileEnglish() {
  console.log('📊 Создаем демонстрационный Excel файл (English)...');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');
  
  // Английские заголовки для проверки маппинга
  worksheet.columns = [
    { header: 'Drawing Number', key: 'drawing_number', width: 20 },
    { header: 'Qty', key: 'quantity', width: 10 },
    { header: 'Due Date', key: 'deadline', width: 15 },
    { header: 'Priority', key: 'priority', width: 15 },
    { header: 'Operation', key: 'workType', width: 20 }
  ];
  
  // Тестовые данные с английскими значениями
  const testOrders = [
    {
      drawing_number: 'ENG-001',
      quantity: 12,
      deadline: new Date('2025-07-18'),
      priority: 'high',
      workType: 'Milling'
    },
    {
      drawing_number: 'ENG-002', 
      quantity: 8,
      deadline: new Date('2025-07-22'),
      priority: 'critical',
      workType: 'Turning'
    },
    {
      drawing_number: 'ENG-003',
      quantity: 20,
      deadline: new Date('2025-07-30'),
      priority: 'medium',
      workType: 'Drilling'
    }
  ];
  
  // Добавляем данные
  testOrders.forEach(order => {
    worksheet.addRow(order);
  });
  
  // Стилизация
  worksheet.getRow(1).eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6FFE6' }
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    worksheet.getRow(rowNum).eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }
  
  const fileName = 'test-orders-english.xlsx';
  const filePath = path.join(__dirname, '..', fileName);
  
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Английский демонстрационный файл создан: ${fileName}`);
  
  return filePath;
}

async function main() {
  try {
    console.log('🚀 СОЗДАНИЕ ДЕМОНСТРАЦИОННЫХ EXCEL ФАЙЛОВ\n');
    
    // Проверяем, есть ли ExcelJS
    try {
      require('exceljs');
    } catch (error) {
      console.log('❌ ExcelJS не установлен. Устанавливаем...');
      const { execSync } = require('child_process');
      execSync('npm install exceljs', { cwd: path.join(__dirname, '..', 'backend') });
      console.log('✅ ExcelJS установлен');
    }
    
    const russianFile = await createTestExcelFile();
    const englishFile = await createTestExcelFileEnglish();
    
    console.log('\n📋 ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ:');
    console.log('1. Запустите систему: START-FULL-SYSTEM-WITH-EXCEL.bat');
    console.log('2. Откройте http://localhost:5101');
    console.log('3. Перейдите в раздел "База данных"');
    console.log('4. Нажмите "🗄️ Excel БД Менеджер"');
    console.log('5. Выберите фильтр "Стандартный импорт заказов"');
    console.log('6. Перетащите один из созданных файлов:');
    console.log(`   - ${path.basename(russianFile)} (русские заголовки)`);
    console.log(`   - ${path.basename(englishFile)} (английские заголовки)`);
    console.log('7. Наблюдайте, как файл сохраняется в БД и данные импортируются!');
    
    console.log('\n🎯 ЧТО ДОЛЖНО ПРОИЗОЙТИ:');
    console.log('✅ Файл сохранится в папку backend/uploads/excel/');
    console.log('✅ Запись о файле появится в таблице excel_imports');
    console.log('✅ Все ячейки сохранятся в таблице excel_data');
    console.log('✅ Данные импортируются в таблицу orders');
    console.log('✅ В интерфейсе появится отчет о результатах импорта');
    
  } catch (error) {
    console.error('❌ Ошибка создания файлов:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestExcelFile, createTestExcelFileEnglish };
