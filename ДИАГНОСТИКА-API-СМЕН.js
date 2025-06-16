/**
 * ДИАГНОСТИКА API СМЕН
 * Скрипт для проверки работы API /api/shifts
 */

console.log('🔍 ДИАГНОСТИКА API СМЕН');
console.log('Проверим что возвращает API за последние 3 дня');

// Получаем даты
const today = new Date();
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(today.getDate() - 3);

const startDate = threeDaysAgo.toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log(`📅 Период: ${startDate} - ${endDate}`);

// URL для тестирования
const apiUrl = `http://localhost:3001/api/shifts?startDate=${startDate}&endDate=${endDate}`;
console.log(`🌐 URL: ${apiUrl}`);

// Тестирование в браузере
console.log(`
💡 ДЛЯ ДИАГНОСТИКИ ВЫПОЛНИТЕ В КОНСОЛИ БРАУЗЕРА:

1. Откройте DevTools (F12)
2. Скопируйте и выполните:

fetch("${apiUrl}")
  .then(response => response.json())
  .then(data => {
    console.log("🔍 РЕЗУЛЬТАТ API /api/shifts:", data);
    console.log("📊 Количество смен:", data.length);
    
    // Поиск смен для операции C6HP0021A
    const c6hp0021aShifts = data.filter(shift => 
      shift.drawingnumber === 'C6HP0021A' || 
      shift.orderDrawingNumber === 'C6HP0021A'
    );
    
    console.log("🎯 Смены для C6HP0021A:", c6hp0021aShifts);
    
    // Поиск смен для станка ID 3
    const machine3Shifts = data.filter(shift => 
      shift.machineId === 3 || shift.machineId === "3"
    );
    
    console.log("🏭 Смены для станка ID 3:", machine3Shifts);
  })
  .catch(error => {
    console.error("❌ Ошибка API:", error);
  });

3. Проверьте результаты в консоли
`);
