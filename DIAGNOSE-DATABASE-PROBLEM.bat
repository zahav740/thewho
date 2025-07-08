@echo off
echo 🔍 ДИАГНОСТИКА ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ
echo ================================================

cd /d C:\Users\Alexey\Downloads\thewho-main\backend

echo.
echo 📋 1. Проверяем состояние backend сервера...
echo.

curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend отвечает на http://localhost:5100/api/orders
) else (
    echo ❌ Backend НЕ отвечает на http://localhost:5100/api/orders
    echo.
    echo 🚀 Пытаемся запустить backend...
    echo.
    start /B cmd /c "npm run start:dev > backend.log 2>&1"
    echo ⏳ Ждем 10 секунд...
    timeout /t 10 /nobreak > nul
)

echo.
echo 📋 2. Тестируем API endpoints...
echo.

echo Тестируем GET /api/orders:
curl -s http://localhost:5100/api/orders | jq . 2>nul || echo "❌ Ошибка получения заказов"

echo.
echo Тестируем GET /api/orders/count:
curl -s http://localhost:5100/api/orders/count 2>nul || echo "❌ Endpoint /count не найден"

echo.
echo 📋 3. Проверяем базу данных...
echo.

node -e "
const { createConnection } = require('typeorm');
const path = require('path');

async function checkDatabase() {
  try {
    const config = require('./ormconfig.ts');
    console.log('📊 Конфигурация БД:', config.database);
    
    const connection = await createConnection(config);
    console.log('✅ Подключение к БД успешно');
    
    const orders = await connection.query('SELECT COUNT(*) as count FROM orders WHERE isDeleted = false OR isDeleted IS NULL');
    console.log('📈 Количество заказов в БД:', orders[0].count);
    
    await connection.close();
  } catch (error) {
    console.error('❌ Ошибка БД:', error.message);
  }
}

checkDatabase();
"

echo.
echo 📋 4. Проверяем frontend...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\frontend

curl -s http://localhost:5101 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend работает на http://localhost:5101
) else (
    echo ❌ Frontend НЕ работает на http://localhost:5101
    echo 🚀 Запустите frontend: npm start
)

echo.
echo 📋 РЕЗЮМЕ:
echo ================================================
echo 1. Backend должен работать на порту 5100
echo 2. Frontend должен работать на порту 5101  
echo 3. API endpoint: http://localhost:5100/api/orders
echo 4. Проверьте логи выше на ошибки
echo.
echo 🛠️  ВОЗМОЖНЫЕ РЕШЕНИЯ:
echo - Если backend не отвечает: npm run start:dev
echo - Если БД недоступна: проверьте PostgreSQL
echo - Если нет данных: создайте тестовые заказы
echo.
pause
