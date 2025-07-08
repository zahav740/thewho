@echo off
echo 🚀 БЫСТРЫЙ ЗАПУСК И ИСПРАВЛЕНИЕ БАЗЫ ДАННЫХ
echo ================================================

echo.
echo 📋 1. Проверяем и запускаем backend...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\backend

:: Проверяем, работает ли backend
curl -s http://localhost:5100/api/orders > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend уже работает на порту 5100
) else (
    echo ❌ Backend не отвечает, запускаем...
    echo.
    echo 🔧 Устанавливаем зависимости...
    npm install --silent
    
    echo 🚀 Запускаем backend в фоне...
    start /MIN cmd /c "npm run start:dev"
    
    echo ⏳ Ждем запуска backend (15 секунд)...
    timeout /t 15 /nobreak > nul
)

echo.
echo 📋 2. Проверяем API и создаем тестовые данные...
echo.

:: Проверяем API
curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" > api_test.json
if exist api_test.json (
    echo ✅ API orders отвечает
    
    :: Читаем количество заказов
    node -e "
    try {
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('api_test.json', 'utf8'));
      console.log('📊 Заказов в базе:', data.total || 0);
      if ((data.total || 0) === 0) {
        console.log('❌ База данных пуста - создаем тестовые заказы...');
        process.exit(1);
      }
    } catch (e) {
      console.log('❌ Ошибка чтения API ответа:', e.message);
      process.exit(1);
    }
    "
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo 🔧 Создаем тестовые заказы...
        
        curl -X POST http://localhost:5100/api/orders ^
        -H "Content-Type: application/json" ^
        -d "{\"drawingNumber\":\"TEST-001\",\"quantity\":10,\"deadline\":\"2025-08-15T00:00:00.000Z\",\"priority\":2,\"workType\":\"Фрезерная обработка\",\"operations\":[]}" > nul 2>&1
        
        curl -X POST http://localhost:5100/api/orders ^
        -H "Content-Type: application/json" ^
        -d "{\"drawingNumber\":\"TEST-002\",\"quantity\":5,\"deadline\":\"2025-08-20T00:00:00.000Z\",\"priority\":1,\"workType\":\"Токарная обработка\",\"operations\":[]}" > nul 2>&1
        
        curl -X POST http://localhost:5100/api/orders ^
        -H "Content-Type: application/json" ^
        -d "{\"drawingNumber\":\"TEST-003\",\"quantity\":8,\"deadline\":\"2025-08-25T00:00:00.000Z\",\"priority\":3,\"workType\":\"Сборка\",\"operations\":[]}" > nul 2>&1
        
        echo ✅ Создано 3 тестовых заказа
    )
    
    del api_test.json > nul 2>&1
) else (
    echo ❌ API не отвечает
)

echo.
echo 📋 3. Проверяем frontend...
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\frontend

curl -s http://localhost:5101 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend работает на порту 5101
) else (
    echo ❌ Frontend не работает
    echo 🚀 Запускаем frontend...
    start /MIN cmd /c "npm start"
    echo ⏳ Frontend запущен в фоне
)

echo.
echo 📋 ИТОГОВАЯ ПРОВЕРКА:
echo ================================================

echo 🔍 Тестируем финальный результат...
timeout /t 3 /nobreak > nul

curl -s http://localhost:5100/api/orders -H "Content-Type: application/json" > final_test.json
if exist final_test.json (
    node -e "
    try {
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('final_test.json', 'utf8'));
      console.log('✅ УСПЕХ! Backend работает');
      console.log('📊 Всего заказов:', data.total || 0);
      console.log('📋 Данных на странице:', (data.data || []).length);
      if (data.data && data.data.length > 0) {
        console.log('📝 Первый заказ:', data.data[0].drawingNumber);
      }
    } catch (e) {
      console.log('❌ Ошибка:', e.message);
    }
    "
    del final_test.json > nul 2>&1
) else (
    echo ❌ API все еще не отвечает
)

echo.
echo 🌐 Откройте: http://localhost:5101/database
echo 📋 Backend API: http://localhost:5100/api/orders
echo.
echo ✅ ГОТОВО! Если база данных все еще пуста:
echo   1. Перейдите в раздел "База данных" 
echo   2. Нажмите "Создать заказ"
echo   3. Или используйте импорт CSV/Excel
echo.
pause
