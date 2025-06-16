@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 ТЕСТ API ОПЕРАТОРОВ ДЛЯ МОДАЛЬНОГО ОКНА
echo ========================================
echo.

echo 📋 Проверяем API операторов на Backend (порт 5100):
echo.

echo 1️⃣ Тестовый endpoint операторов:
curl -s "http://localhost:5100/api/operators/test" | jq .
echo.

echo 2️⃣ Все активные операторы:
curl -s "http://localhost:5100/api/operators?active=true" | jq .
echo.

echo 3️⃣ Операторы производства:
curl -s "http://localhost:5100/api/operators/production" | jq .
echo.

echo 4️⃣ Операторы наладки:
curl -s "http://localhost:5100/api/operators/setup" | jq .
echo.

echo 📊 Состояние базы данных:
psql -h localhost -U postgres -d thewho -c "SELECT id, name, \"isActive\", \"operatorType\", \"createdAt\" FROM operators ORDER BY name;"
echo.

echo ✅ Тестирование завершено!
echo 💡 Если видите ошибки, запустите сначала backend: ЗАПУСК-BACKEND.bat
pause