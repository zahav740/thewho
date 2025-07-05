/**
 * @file: test-analytics-api.js
 * @description: Тестирование API аналитики
 * @created: 2025-06-30
 */

// Простой тест API аналитики
async function testAnalyticsAPI() {
  const baseURL = 'http://localhost:5100/api';
  
  console.log('🧪 Начинаем тестирование API аналитики...');
  
  // 1. Тест endpoint /analytics/kpi-oee
  try {
    console.log('\n📊 Тестируем /analytics/kpi-oee...');
    const response = await fetch(`${baseURL}/analytics/kpi-oee?startDate=2025-06-29&endDate=2025-06-30`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ KPI/OEE Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`📋 Найдено смен: ${data.data.shifts.length}`);
      console.log(`📈 Общий OEE: ${data.data.aggregated.overallOEE}%`);
      console.log(`👥 Общий KPI: ${data.data.aggregated.overallKPI}%`);
    }
  } catch (error) {
    console.error('❌ Ошибка KPI/OEE:', error.message);
  }
  
  // 2. Тест endpoint /analytics/operators
  try {
    console.log('\n👥 Тестируем /analytics/operators...');
    const response = await fetch(`${baseURL}/analytics/operators?startDate=2025-06-29&endDate=2025-06-30`);
    const data = await response.json();
    console.log('✅ Operators Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Ошибка Operators:', error.message);
  }
  
  // 3. Тест endpoint /analytics/machines
  try {
    console.log('\n🏭 Тестируем /analytics/machines...');
    const response = await fetch(`${baseURL}/analytics/machines?startDate=2025-06-29&endDate=2025-06-30`);
    const data = await response.json();
    console.log('✅ Machines Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Ошибка Machines:', error.message);
  }
  
  // 4. Тест endpoint /analytics/summary
  try {
    console.log('\n📋 Тестируем /analytics/summary...');
    const response = await fetch(`${baseURL}/analytics/summary?startDate=2025-06-29&endDate=2025-06-30`);
    const data = await response.json();
    console.log('✅ Summary Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Ошибка Summary:', error.message);
  }
  
  console.log('\n🏁 Тестирование завершено');
}

// Запускаем тест
testAnalyticsAPI();
