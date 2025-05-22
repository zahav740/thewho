// Тест исправленной логики обработки просроченных заказов
const testData = {
  // Просроченный заказ с НИЗКИМ приоритетом
  overdueOrder1: {
    id: "test-overdue-1",
    drawingNumber: "BM14362A",
    deadline: "2025-05-04T14:00:00.000Z", // 04.05.2025 - просрочено
    priority: 3, // НИЗКИЙ приоритет
    quantity: 10,
    operations: [
      { id: "op-1-1", sequenceNumber: 1, operationType: "3-axis", estimatedTime: 60 },
      { id: "op-1-2", sequenceNumber: 2, operationType: "turning", estimatedTime: 45 }
    ]
  },
  
  // Ещё один просроченный заказ с НИЗКИМ приоритетом (больше просрочка)
  overdueOrder2: {
    id: "test-overdue-2",
    drawingNumber: "OLD123",
    deadline: "2025-04-15T14:00:00.000Z", // 15.04.2025 - более просрочено
    priority: 3, // НИЗКИЙ приоритет
    quantity: 5,
    operations: [
      { id: "op-2-1", sequenceNumber: 1, operationType: "milling", estimatedTime: 30 }
    ]
  },
  
  // Обычный заказ с НИЗКИМ приоритетом
  normalOrder1: {
    id: "test-normal-1",
    drawingNumber: "NORM123",
    deadline: "2025-06-15T14:00:00.000Z", // 15.06.2025 - в будущем
    priority: 3, // НИЗКИЙ приоритет
    quantity: 5,
    operations: [
      { id: "op-3-1", sequenceNumber: 1, operationType: "milling", estimatedTime: 30 }
    ]
  },
  
  // Высокий приоритет
  highPriorityOrder: {
    id: "test-high-priority",
    drawingNumber: "URGENT456",
    deadline: "2025-07-01T14:00:00.000Z", // 01.07.2025 - далеко в будущем
    priority: 1, // ВЫСОКИЙ приоритет
    quantity: 3,
    operations: [
      { id: "op-4-1", sequenceNumber: 1, operationType: "4-axis", estimatedTime: 90 }
    ]
  }
};

// Функция для симуляции исправленной логики обработки просроченных заказов
function preprocessOrdersForPlanning(orders) {
  const currentDate = new Date();
  const processedOrders = [];
  
  console.log('\n📋 === ТЕСТИРОВАНИЕ ИСПРАВЛЕННОЙ ЛОГИКИ ОБРАБОТКИ ЗАКАЗОВ ===');
  console.log(`📅 Текущая дата: ${currentDate.toLocaleDateString('ru-RU')} (${currentDate.toISOString()})`);
  console.log(`📦 Всего заказов для обработки: ${orders.length}`);
  
  for (const order of orders) {
    let processedOrder = { ...order };
    const deadline = new Date(order.deadline);
    
    console.log(`\n🔍 Заказ ${order.drawingNumber}:`);
    console.log(`   📅 Дедлайн: ${deadline.toLocaleDateString('ru-RU')}`);
    console.log(`   ⭐ Приоритет: ${order.priority}`);
    
    // Проверяем, просрочен ли дедлайн
    if (deadline < currentDate) {
      const daysOverdue = Math.ceil((currentDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      console.warn(`⚠️ ПРОСРОЧЕННЫЙ ДЕДЛАЙН: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней!`);
      
      // НЕ повышаем приоритет - оставляем исходный!
      console.log(`📌 Приоритет остается прежним: ${processedOrder.priority} (просрочка не меняет приоритет)`);
      
      // Добавляем степень просрочки для сортировки внутри приоритета
      processedOrder.daysOverdue = daysOverdue;
      processedOrder.isOverdue = true;
      
      // Вычисляем новый реалистичный дедлайн
      const newDeadline = calculateRealisticDeadline(processedOrder, currentDate);
      console.log(`📅 Переопределяем дедлайн с ${deadline.toLocaleDateString('ru-RU')} на ${newDeadline.toLocaleDateString('ru-RU')}`);
      processedOrder.deadline = newDeadline.toISOString();
      
      console.log(`🚨 Создан алерт: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней`);
    } else {
      const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`✅ Дедлайн в пределах нормы (через ${daysUntilDeadline} дней)`);
      
      // Для не просроченных заказов
      processedOrder.daysOverdue = 0;
      processedOrder.isOverdue = false;
    }
    
    processedOrders.push(processedOrder);
  }
  
  console.log(`\n✅ Обработано ${processedOrders.length} заказов`);
  return processedOrders;
}

// Функция сортировки по новой логике
function sortOrdersByPriorityAndDeadline(orders) {
  console.log('\n🔄 === СОРТИРОВКА ЗАКАЗОВ ===');
  console.log('📋 Логика сортировки:');
  console.log('   1. По приоритету (больший приоритет = выше важность)');
  console.log('   2. Внутри приоритета: просроченные в порядке убывания просрочки');
  console.log('   3. Затем: обычные заказы по дедлайну (раньше = выше важность)');
  
  const sorted = orders.sort((a, b) => {
    // 1. Сначала по приоритету (больший приоритет = выше важность)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // 2. Внутри одного приоритета: просроченные сначала
    const aOverdue = a.isOverdue || false;
    const bOverdue = b.isOverdue || false;
    const aDaysOverdue = a.daysOverdue || 0;
    const bDaysOverdue = b.daysOverdue || 0;
    
    // Если один просрочен, а другой нет - просроченный идет первым
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Если оба просрочены - сортируем по степени просрочки (больше просрочка = выше)
    if (aOverdue && bOverdue) {
      return bDaysOverdue - aDaysOverdue; // От большей просрочки к меньшей
    }
    
    // 3. Если оба не просрочены - сортируем по дедлайну (раньше = выше важность)
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  
  // Логируем результат сортировки
  console.log('\n📋 Результат сортировки:');
  sorted.forEach((order, index) => {
    const overdue = order.isOverdue || false;
    const daysOverdue = order.daysOverdue || 0;
    const overdueInfo = overdue ? ` (просрочен на ${daysOverdue} дней)` : '';
    const deadline = new Date(order.deadline).toLocaleDateString('ru-RU');
    
    console.log(`   ${index + 1}. ${order.drawingNumber} - приоритет ${order.priority}, дедлайн ${deadline}${overdueInfo}`);
  });
  
  return sorted;
}

// Функция для вычисления нового реалистичного дедлайна
function calculateRealisticDeadline(order, fromDate) {
  const totalTimeMinutes = order.operations.reduce((total, op) => {
    return total + (op.estimatedTime || 0) * order.quantity;
  }, 0);
  
  const bufferedTimeMinutes = totalTimeMinutes * 1.3 + (order.operations.length * 60);
  const workingDaysNeeded = Math.ceil(bufferedTimeMinutes / 480);
  const newDeadline = new Date(fromDate);
  const calendarDaysToAdd = Math.ceil(workingDaysNeeded * 1.4) + 2;
  newDeadline.setDate(newDeadline.getDate() + calendarDaysToAdd);
  
  return newDeadline;
}

// Запускаем тест
console.log('🧪 ЗАПУСК ТЕСТА ИСПРАВЛЕННОЙ ЛОГИКИ');

const testOrders = [
  testData.overdueOrder1,
  testData.overdueOrder2,
  testData.normalOrder1,
  testData.highPriorityOrder
];

// 1. Предварительная обработка
const processedOrders = preprocessOrdersForPlanning(testOrders);

// 2. Сортировка
const sortedOrders = sortOrdersByPriorityAndDeadline(processedOrders);

console.log('\n📊 === ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ ===');
console.log('\n🎯 Ожидаемый порядок выполнения:');
console.log('1. URGENT456 (приоритет 1, не просрочен)');
console.log('2. OLD123 (приоритет 3, просрочен на ~34 дня)');
console.log('3. BM14362A (приоритет 3, просрочен на ~15 дней)');
console.log('4. NORM123 (приоритет 3, не просрочен)');

console.log('\n✅ ТЕСТ ЗАВЕРШЕН');

// Проверяем правильность сортировки
const expectedOrder = ['URGENT456', 'OLD123', 'BM14362A', 'NORM123'];
const actualOrder = sortedOrders.map(order => order.drawingNumber);

console.log('\n🔍 === ПРОВЕРКА РЕЗУЛЬТАТОВ ===');
console.log('Ожидаемый порядок:', expectedOrder);
console.log('Фактический порядок:', actualOrder);

const isCorrect = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
console.log(isCorrect ? '✅ ТЕСТ ПРОЙДЕН!' : '❌ ТЕСТ НЕ ПРОЙДЕН!');
