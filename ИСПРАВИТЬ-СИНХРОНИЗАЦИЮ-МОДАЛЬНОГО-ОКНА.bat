@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 ИСПРАВЛЕНИЕ СИНХРОНИЗАЦИИ БД В МОДАЛЬНОМ ОКНЕ
echo ========================================
echo.

echo 1️⃣ Проверяем состояние backend...
curl -s "http://localhost:5100/api/health" | jq . || echo "❌ Backend не запущен"
echo.

echo 2️⃣ Тестируем API операторов...
curl -s "http://localhost:5100/api/operators/test" | jq .
echo.

echo 3️⃣ Получаем список операторов...
curl -s "http://localhost:5100/api/operators?active=true" | jq .
echo.

echo 4️⃣ Проверяем данные в базе...
psql -h localhost -U postgres -d thewho -c "SELECT COUNT(*) as total_operators, COUNT(CASE WHEN \"isActive\" = true THEN 1 END) as active_operators FROM operators;"
echo.

echo 5️⃣ Запускаем frontend для тестирования...
echo 🌐 Откройте http://localhost:3000 в браузере
echo 📋 Перейдите в Учет смен > Мониторинг
echo ➕ Нажмите "Запись смены" на любом станке
echo 🔍 В модальном окне должна появиться диагностика API операторов
echo.

cd frontend
echo ▶️ Запускаем frontend в режиме разработки...
npm start

pause