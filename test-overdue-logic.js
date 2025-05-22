// Тест логики обработки просроченных дедлайнов
const testData = {
  // Просроченный заказ
  overdueOrder: {
    id: "test-overdue-order",
    drawingNumber: "BM14362A",
    deadline: "2025-05-04T14:00:00.000Z", // 04.05.2025 - просрочено
    priority: 3,
    quantity: 10,
    operations: [
      {
        id: "op-test-1",
        sequenceNumber: 1,
        operationType: "3-axis",
        estimatedTime: 60,
        description: "Фрезерование"
      },
      {
        id: "op-test-2",
        sequenceNumber: 2,
        operationType: "turning",
        estimatedTime: 45,
        description: "Токарная обработка"
      }
    ]
  },
  
  // Обычный заказ
  normalOrder: {
    id: "test-normal-order",
    drawingNumber: "NORM123",
    deadline: "2025-06-15T14:00:00.000Z", // 15.06.2025 - в будущем
    priority: 2,
    quantity: 5,
    operations: [
      {
        id: "op-norm-1",
        sequenceNumber: 1,
        operationType: "milling",
        estimatedTime: 30,
        description: "Фрезерование"
      }
    ]
  }
};

// Функция для симуляции логики обработки просроченных заказов
function preprocessOrdersForPlanning(orders) {
  const currentDate = new Date();
  const processedOrders = [];
  
  console.log('\n📋 === ТЕСТИРОВАНИЕ ПРЕДВАРИТЕЛЬНОЙ ОБРАБОТКИ ЗАКАЗОВ ===');
  console.log(`📅 Текущая дата: ${currentDate.toLocaleDateString('ru-RU')} (${currentDate.toISOString()})`);
  console.log(`📦 Всего заказов для обработки: ${orders.length}`);
  
  for (const order of orders) {
    let processedOrder = { ...order };
    const deadline = new Date(order.deadline);
    
    console.log(`\n🔍 Заказ ${order.drawingNumber}:`);
    console.log(`   📅 Дедлайн: ${deadline.toLocaleDateString('ru-RU')} (${deadline.toISOString()})`);
    console.log(`   🏗️ Операций: ${order.operations.length}`);
    console.log(`   🔢 Количество: ${order.quantity}`);
    console.log(`   ⭐ Приоритет: ${order.priority}`);
    
    // Проверяем, просрочен ли дедлайн
    if (deadline < currentDate) {
      const daysOverdue = Math.ceil((currentDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      console.warn(`⚠️ ПРОСРОЧЕННЫЙ ДЕДЛАЙН: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней!`);
      
      // Повышаем приоритет просроченного заказа до максимального
      if (processedOrder.priority > 1) {
        console.log(`🔺 Повышаем приоритет с ${processedOrder.priority} до 1 (критический)`);
        processedOrder.priority = 1;
      } else {
        console.log(`✅ Приоритет уже максимальный (${processedOrder.priority})`);
      }
      
      // Вычисляем новый реалистичный дедлайн
      const newDeadline = calculateRealisticDeadline(processedOrder, currentDate);
      console.log(`📅 Переопределяем дедлайн с ${deadline.toLocaleDateString('ru-RU')} на ${newDeadline.toLocaleDateString('ru-RU')}`);
      processedOrder.deadline = newDeadline.toISOString();
      
      // Создаем алерт о просроченном заказе
      console.log(`🚨 Создан алерт: Заказ ${order.drawingNumber} просрочен на ${daysOverdue} дней`);
    } else {
      const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`✅ Дедлайн в пределах нормы (через ${daysUntilDeadline} дней)`);
    }
    
    processedOrders.push(processedOrder);
  }
  
  console.log(`\n✅ Обработано ${processedOrders.length} заказов`);
  
  return processedOrders;
}

// Функция для вычисления нового реалистичного дедлайна
function calculateRealisticDeadline(order, fromDate) {
  // Суммируем время всех операций
  const totalTimeMinutes = order.operations.reduce((total, op) => {
    return total + (op.estimatedTime || 0) * order.quantity;
  }, 0);
  
  // Добавляем 30% буфер и время наладки (примерно 60 мин на операцию)
  const bufferedTimeMinutes = totalTimeMinutes * 1.3 + (order.operations.length * 60);
  
  // Учитываем рабочие дни (примерно 8 часов в день)
  const workingDaysNeeded = Math.ceil(bufferedTimeMinutes / 480); // 480 мин = 8 часов
  
  // Создаем новую дату, добавляя рабочие дни + небольшой запас
  const newDeadline = new Date(fromDate);
  
  // Добавляем дни с учетом выходных (множим на 1.4 для учета выходных)
  const calendarDaysToAdd = Math.ceil(workingDaysNeeded * 1.4) + 2; // +2 дня запас
  newDeadline.setDate(newDeadline.getDate() + calendarDaysToAdd);
  
  console.log(`   📊 Время операций: ${totalTimeMinutes} мин`);
  console.log(`   📊 Время с буфером: ${bufferedTimeMinutes} мин`);
  console.log(`   📊 Рабочих дней нужно: ${workingDaysNeeded}`);
  console.log(`   📊 Календарных дней добавляем: ${calendarDaysToAdd}`);
  
  return newDeadline;
}

// Запускаем тест
console.log('🧪 ЗАПУСК ТЕСТА ОБРАБОТКИ ПРОСРОЧЕННЫХ ДЕДЛАЙНОВ');

const testOrders = [testData.overdueOrder, testData.normalOrder];
const processedOrders = preprocessOrdersForPlanning(testOrders);

console.log('\n📊 === РЕЗУЛЬТАТЫ ТЕСТА ===');
processedOrders.forEach((order, index) => {
  console.log(`\n${index + 1}. Заказ ${order.drawingNumber}:`);
  console.log(`   🏷️ ID: ${order.id}`);
  console.log(`   📅 Дедлайн: ${new Date(order.deadline).toLocaleDateString('ru-RU')}`);
  console.log(`   ⭐ Приоритет: ${order.priority}`);
  console.log(`   🔢 Количество: ${order.quantity}`);
  console.log(`   🏗️ Операций: ${order.operations.length}`);
});

console.log('\n✅ ТЕСТ ЗАВЕРШЕН');
