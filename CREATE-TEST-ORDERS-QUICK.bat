@echo off
echo 🔧 СОЗДАНИЕ ТЕСТОВЫХ ЗАКАЗОВ
echo ================================

cd /d C:\Users\Alexey\Downloads\thewho-main\backend

echo.
echo 📋 Используем тестовый endpoint для создания заказов...
echo.

curl -X POST http://localhost:5100/api/excel-simple/create-test-orders ^
-H "Content-Type: application/json" > test_orders_result.json

if exist test_orders_result.json (
    echo ✅ Ответ получен:
    type test_orders_result.json
    del test_orders_result.json > nul 2>&1
) else (
    echo ❌ Ошибка создания тестовых заказов
)

echo.
echo 📊 Проверяем результат...
curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" | node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    console.log('📈 Всего заказов в базе:', data.total || 0);
    if (data.data && data.data.length > 0) {
      console.log('📋 Заказы:');
      data.data.forEach((order, i) => {
        console.log(`  ${i+1}. ${order.drawingNumber} (${order.quantity} шт.)`);
      });
    }
  } catch (e) {
    console.log('❌ Ошибка парсинга:', e.message);
  }
});
"

echo.
echo 🌐 Теперь откройте: http://localhost:5101/database
pause
