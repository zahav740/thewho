import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';

async function createTestExcelFile() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Заказы');

  // Заголовки
  worksheet.columns = [
    { header: 'Номер чертежа', key: 'drawing_number', width: 20 },
    { header: 'Количество', key: 'quantity', width: 12 },
    { header: 'Срок', key: 'deadline', width: 15 },
    { header: 'Приоритет', key: 'priority', width: 12 },
    { header: 'Тип работы', key: 'workType', width: 20 },
    { header: 'Заказчик', key: 'customer', width: 20 }
  ];

  // Тестовые данные
  const testData = [
    {
      drawing_number: 'DWG-001',
      quantity: 10,
      deadline: new Date('2025-07-15'),
      priority: 'Высокий',
      workType: 'Производство',
      customer: 'ООО Клиент 1'
    },
    {
      drawing_number: 'DWG-002', 
      quantity: 25,
      deadline: new Date('2025-07-20'),
      priority: 'Средний',
      workType: 'Обработка',
      customer: 'ООО Клиент 2'
    },
    {
      drawing_number: 'DWG-003',
      quantity: 5,
      deadline: new Date('2025-07-10'),
      priority: 'Критический',
      workType: 'Сборка',
      customer: 'ООО Клиент 3'
    },
    {
      drawing_number: 'DWG-004',
      quantity: 15,
      deadline: new Date('2025-08-01'),
      priority: 'Низкий',
      workType: 'Производство',
      customer: 'ООО Клиент 1'
    },
    {
      drawing_number: 'DWG-005',
      quantity: 30,
      deadline: new Date('2025-07-25'),
      priority: 'Средний', 
      workType: 'Обработка',
      customer: 'ООО Клиент 4'
    }
  ];

  // Добавляем данные
  testData.forEach(row => {
    worksheet.addRow(row);
  });

  // Форматирование заголовков
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };

  // Сохраняем файл
  await workbook.xlsx.writeFile('test_excel_import.xlsx');
  console.log('✅ Тестовый Excel файл создан: test_excel_import.xlsx');
}

createTestExcelFile().catch(console.error);
