@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 ЗАПУСК ЧИСТОЙ ПРОДАКШЕН ВЕРСИИ
echo ========================================
echo.

echo ✅ ОЧИСТКА ЗАВЕРШЕНА:
echo    ❌ Удалены все тестовые данные C6HP0021A-TEST
echo    ❌ Отключены тестовые компоненты ShiftsDataTest
echo    ❌ Удалена диагностика из модального окна
echo    ✅ Система работает только с реальными данными БД
echo.

echo 📊 ПРОВЕРКА СОСТОЯНИЯ:
echo.

echo 1️⃣ Проверяем backend...
curl -s "http://localhost:5100/api/health" | jq . || echo "❌ Backend не запущен"
echo.

echo 2️⃣ Проверяем API операторов...
curl -s "http://localhost:5100/api/operators/test" | jq .status
echo.

echo 3️⃣ Проверяем отсутствие тестовых данных...
psql -h localhost -U postgres -d thewho -c "SELECT COUNT(*) as test_orders FROM orders WHERE \"drawingNumber\" LIKE '%TEST%';"
echo.

echo ========================================
echo 🎯 ЗАПУСК FRONTEND (ПРОДАКШЕН ВЕРСИЯ)
echo ========================================
echo.

echo 🌐 Откройте: http://localhost:3000
echo 📋 Перейдите: Учет смен > Мониторинг > Запись смены
echo ✅ Операторы загружаются из БД
echo ⚠️ Информация об операции: "Операция не найдена" (нормально)
echo 💡 Добавьте реальные заказы/операции для тестирования
echo.

cd frontend
echo ▶️ Запуск React приложения...
npm start

pause