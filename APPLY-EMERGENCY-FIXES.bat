@echo off
chcp 65001 >nul
echo ===========================================
echo 🆘 ПРИМЕНЕНИЕ ЭКСТРЕННЫХ ИСПРАВЛЕНИЙ
echo ===========================================
echo.

echo 📊 Анализ текущего состояния системы...
echo.

REM Проверяем подключение к БД
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Подключение к БД успешно' as status;" 2>nul
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Не удается подключиться к базе данных!
    echo Проверьте что PostgreSQL запущен и доступен по адресу localhost:5432
    pause
    exit /b 1
)

echo ✅ Подключение к базе данных успешно
echo.

echo 🔍 Проверяем текущее состояние...
psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
  'ТЕКУЩЕЕ СОСТОЯНИЕ:' as info,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM operations) as total_operations,
  (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM operations op WHERE op.\"orderId\" = o.id)) as orders_without_operations;
"

echo.
echo 🚀 Применяем критические исправления...
echo.

REM Применяем SQL скрипт с исправлениями
psql -h localhost -p 5432 -U postgres -d thewho -f emergency_fixes.sql

if %errorlevel% neq 0 (
    echo ❌ ОШИБКА при применении исправлений!
    pause
    exit /b 1
)

echo.
echo ✅ Исправления применены успешно!
echo.

echo 📊 Проверяем результат...
psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
  '🎉 РЕЗУЛЬТАТ ИСПРАВЛЕНИЙ:' as info,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM operations) as total_operations,
  (SELECT COUNT(*) FROM operation_progress) as operations_with_progress,
  (SELECT COUNT(*) FROM orders o WHERE NOT EXISTS (SELECT 1 FROM operations op WHERE op.\"orderId\" = o.id)) as orders_without_operations;
"

echo.
echo 🏁 ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!
echo.
echo Теперь можно запускать систему:
echo 1. START-BACKEND.bat
echo 2. START-FRONTEND.bat
echo.
pause
