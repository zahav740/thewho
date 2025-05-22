// Скрипт для проверки данных в localStorage
// Вставьте этот код в консоль браузера для диагностики

console.log('🔍 === ДИАГНОСТИКА ДАННЫХ ПРИЛОЖЕНИЯ ===\n');

// 1. Проверяем заказы
const orders = localStorage.getItem('orders');
if (orders) {
  const parsedOrders = JSON.parse(orders);
  console.log(`📦 Найдено заказов: ${parsedOrders.length}`);
  
  if (parsedOrders.length > 0) {
    console.log('\n📋 Список заказов:');
    const currentDate = new Date();
    
    parsedOrders.forEach((order, index) => {
      const deadline = new Date(order.deadline);
      const isOverdue = deadline < currentDate;
      const daysDiff = Math.round((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      const status = isOverdue ? `❌ ПРОСРОЧЕН на ${Math.abs(daysDiff)} дней` : `✅ До дедлайна ${daysDiff} дней`;
      
      console.log(`   ${index + 1}. ${order.drawingNumber}`);
      console.log(`      📅 Дедлайн: ${deadline.toLocaleDateString('ru-RU')} ${status}`);
      console.log(`      ⭐ Приоритет: ${order.priority}`);
      console.log(`      🔢 Количество: ${order.quantity}`);
      console.log(`      🏗️ Операций: ${order.operations ? order.operations.length : 0}`);
    });
    
    // Проверяем, есть ли заказы с дедлайном 04.05.2025
    const targetDate = '2025-05-04';
    const ordersWithTargetDate = parsedOrders.filter(order => {
      const orderDateStr = order.deadline.startsWith(targetDate);
      return orderDateStr;
    });
    
    if (ordersWithTargetDate.length > 0) {
      console.log(`\n🎯 Найдено ${ordersWithTargetDate.length} заказ(ов) с дедлайном 04.05.2025:`);
      ordersWithTargetDate.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.drawingNumber} (приоритет: ${order.priority})`);
      });
    } else {
      console.log('\n❌ НЕ НАЙДЕНО заказов с дедлайном 04.05.2025');
      console.log('💡 Рекомендация: Создайте тестовый заказ с просроченным дедлайном');
    }
  } else {
    console.log('⚠️ В системе нет заказов');
  }
} else {
  console.log('❌ Заказы не найдены в localStorage');
}

// 2. Проверяем результаты планирования
console.log('\n📊 === РЕЗУЛЬТАТЫ ПЛАНИРОВАНИЯ ===');
const planningResults = localStorage.getItem('planningResults');
if (planningResults) {
  const parsedResults = JSON.parse(planningResults);
  console.log(`✅ Найдено результатов планирования: ${parsedResults.length}`);
  
  if (parsedResults.length > 0) {
    const statusCounts = parsedResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Статусы операций:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} операций`);
    });
  }
} else {
  console.log('❌ Результаты планирования не найдены');
}

// 3. Проверяем алерты
console.log('\n🚨 === АЛЕРТЫ ===');
const alerts = localStorage.getItem('planningAlerts');
if (alerts) {
  const parsedAlerts = JSON.parse(alerts);
  console.log(`🔔 Найдено алертов: ${parsedAlerts.length}`);
  
  if (parsedAlerts.length > 0) {
    const activeAlerts = parsedAlerts.filter(alert => alert.status === 'new');
    console.log(`🚨 Активных алертов: ${activeAlerts.length}`);
    
    activeAlerts.forEach((alert, index) => {
      console.log(`   ${index + 1}. ${alert.title} (${alert.severity})`);
      console.log(`      📝 ${alert.description}`);
    });
  }
} else {
  console.log('❌ Алерты не найдены');
}

// 4. Проверяем смены
console.log('\n🔄 === СМЕНЫ ===');
const shifts = localStorage.getItem('shifts');
if (shifts) {
  const parsedShifts = JSON.parse(shifts);
  console.log(`🕐 Найдено смен: ${parsedShifts.length}`);
} else {
  console.log('❌ Смены не найдены');
}

// 5. Проверяем журнал перепланирований
console.log('\n📝 === ЖУРНАЛ ПЕРЕПЛАНИРОВАНИЙ ===');
const rescheduleLog = localStorage.getItem('rescheduleLog');
if (rescheduleLog) {
  const parsedLog = JSON.parse(rescheduleLog);
  console.log(`📋 Записей в журнале: ${parsedLog.length}`);
} else {
  console.log('❌ Журнал перепланирований пуст');
}

console.log('\n✅ === ДИАГНОСТИКА ЗАВЕРШЕНА ===');
console.log('\n💡 Следующие шаги:');
console.log('1. Если нет просроченных заказов - создайте тестовый заказ');
console.log('2. Если есть просроченные заказы - запустите планирование');
console.log('3. Следите за логами в консоли во время планирования');
console.log('4. Проверьте вкладку "Уведомления" после планирования');
