// Утилита для добавления тестового просроченного заказа
// Выполните этот код в консоли браузера, чтобы добавить тестовый заказ

function addTestOverdueOrder() {
  // Создаем тестовый просроченный заказ
  const testOrder = {
    id: `test-overdue-${Date.now()}`,
    drawingNumber: "TEST-OVERDUE-BM14362A",
    deadline: "2025-05-04T14:00:00.000Z", // 04.05.2025 - просрочено
    priority: 3, // Низкий приоритет
    quantity: 10,
    customer: "Тест Клиент",
    material: "Алюминий",
    description: "Тестовый просроченный заказ для диагностики",
    operations: [
      {
        id: `op-test-${Date.now()}-1`,
        sequenceNumber: 1,
        operationType: "3-axis",
        estimatedTime: 60,
        description: "Фрезерование корпуса",
        // НЕ добавляем completionStatus - операция должна считаться не завершенной
      },
      {
        id: `op-test-${Date.now()}-2`,
        sequenceNumber: 2,
        operationType: "turning",
        estimatedTime: 45,
        description: "Токарная обработка",
        // НЕ добавляем completionStatus - операция должна считаться не завершенной
      }
    ]
  };

  // Получаем существующие заказы
  const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
  
  // Проверяем, нет ли уже такого заказа
  const existingTestOrder = existingOrders.find(o => o.drawingNumber === testOrder.drawingNumber);
  if (existingTestOrder) {
    console.log('⚠️ Тестовый заказ уже существует. Удаляем старый и добавляем новый...');
    const index = existingOrders.findIndex(o => o.drawingNumber === testOrder.drawingNumber);
    existingOrders.splice(index, 1);
  }
  
  // Добавляем новый заказ
  existingOrders.push(testOrder);
  
  // Сохраняем в localStorage
  localStorage.setItem('orders', JSON.stringify(existingOrders));
  
  console.log('✅ Тестовый просроченный заказ добавлен!');
  console.log('📦 Номер чертежа:', testOrder.drawingNumber);
  console.log('📅 Дедлайн:', new Date(testOrder.deadline).toLocaleDateString('ru-RU'));
  console.log('⭐ Приоритет:', testOrder.priority);
  console.log('🏗️ Операций:', testOrder.operations.length);
  
  console.log('\n🚀 Теперь:');
  console.log('1. Перейдите в раздел планирования');
  console.log('2. Нажмите "Базовое планирование" или "Адаптивное планирование"');
  console.log('3. Следите за логами в консоли');
  console.log('4. Заказ должен быть обработан как просроченный');
  
  // Возвращаем заказ для удобства
  return testOrder;
}

// Функция для удаления тестового заказа
function removeTestOverdueOrder() {
  const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
  const filteredOrders = existingOrders.filter(o => !o.drawingNumber.startsWith('TEST-OVERDUE'));
  localStorage.setItem('orders', JSON.stringify(filteredOrders));
  
  console.log('🗑️ Все тестовые просроченные заказы удалены');
}

// Функция для отображения информации о заказах
function showOrdersInfo() {
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const currentDate = new Date();
  
  console.log('\n📋 === ИНФОРМАЦИЯ О ЗАКАЗАХ ===');
  console.log(`📦 Всего заказов: ${orders.length}`);
  
  if (orders.length === 0) {
    console.log('❌ Заказы отсутствуют');
    return;
  }
  
  orders.forEach((order, index) => {
    const deadline = new Date(order.deadline);
    const isOverdue = deadline < currentDate;
    const daysDiff = Math.round((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const status = isOverdue ? `❌ ПРОСРОЧЕН на ${Math.abs(daysDiff)} дней` : `✅ До дедлайна ${daysDiff} дней`;
    const completedOps = order.operations.filter(op => op.completionStatus === 'completed').length;
    
    console.log(`\n${index + 1}. ${order.drawingNumber}`);
    console.log(`   📅 Дедлайн: ${deadline.toLocaleDateString('ru-RU')} ${status}`);
    console.log(`   ⭐ Приоритет: ${order.priority}`);
    console.log(`   🏗️ Операций: ${order.operations.length} (завершено: ${completedOps})`);
  });
  
  const overdueOrders = orders.filter(order => new Date(order.deadline) < currentDate);
  console.log(`\n⚠️ Просроченных заказов: ${overdueOrders.length}`);
}

// Автоматически показываем информацию при загрузке
console.log('🛠️ === УТИЛИТА ДЛЯ ДИАГНОСТИКИ ПРОСРОЧЕННЫХ ЗАКАЗОВ ===');
console.log('📋 Доступные функции:');
console.log('1. addTestOverdueOrder() - добавить тестовый просроченный заказ');
console.log('2. removeTestOverdueOrder() - удалить все тестовые заказы');
console.log('3. showOrdersInfo() - показать информацию о заказах');

// Показываем текущую информацию о заказах
showOrdersInfo();

// Экспортируем функции в глобальную область
window.addTestOverdueOrder = addTestOverdueOrder;
window.removeTestOverdueOrder = removeTestOverdueOrder;
window.showOrdersInfo = showOrdersInfo;
