/**
 * @file: test-delete-all-orders.js
 * @description: Тест для проверки удаления всех заказов
 * @created: 2025-06-30
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5100/api';

async function testDeleteAllOrders() {
  console.log('🧪 Тестируем удаление всех заказов...');
  
  try {
    // Тест 1: DELETE запрос с пустым телом
    console.log('\n1️⃣ Тестируем DELETE с пустым телом:');
    try {
      const response1 = await axios.delete(`${API_BASE}/orders/all/confirm`, {
        data: {}
      });
      console.log('✅ DELETE с пустым телом:', response1.data);
    } catch (error) {
      console.log('❌ DELETE с пустым телом ошибка:', error.response?.status, error.response?.data || error.message);
    }

    // Тест 2: DELETE запрос с confirm: true
    console.log('\n2️⃣ Тестируем DELETE с confirm: true:');
    try {
      const response2 = await axios.delete(`${API_BASE}/orders/all/confirm`, {
        data: { confirm: true }
      });
      console.log('✅ DELETE с confirm:', response2.data);
    } catch (error) {
      console.log('❌ DELETE с confirm ошибка:', error.response?.status, error.response?.data || error.message);
    }

    // Тест 3: POST альтернативный маршрут
    console.log('\n3️⃣ Тестируем POST альтернативу:');
    try {
      const response3 = await axios.post(`${API_BASE}/orders/all/delete`, {
        confirm: true
      });
      console.log('✅ POST альтернатива:', response3.data);
    } catch (error) {
      console.log('❌ POST альтернатива ошибка:', error.response?.status, error.response?.data || error.message);
    }

    // Тест 4: Проверим сколько заказов осталось
    console.log('\n4️⃣ Проверяем количество заказов:');
    try {
      const response4 = await axios.get(`${API_BASE}/orders?limit=1`);
      console.log(`📊 Количество заказов: ${response4.data.total}`);
    } catch (error) {
      console.log('❌ Ошибка получения заказов:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error.message);
  }
}

// Запускаем тест
testDeleteAllOrders();
