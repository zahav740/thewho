@echo off
chcp 65001 >nul
echo ====================================
echo 🔧 ИСПРАВЛЕНИЕ СТРУКТУРЫ БД
echo ====================================
echo.

echo %YELLOW%Исправляем структуру базы данных для операций...%RESET%
echo.

echo 1. Проверяем подключение к PostgreSQL...
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT 'Подключение успешно!' as status;" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Не удается подключиться к базе данных
    echo Проверьте что PostgreSQL запущен и база данных 'thewho' существует
    pause
    exit /b 1
)

echo ✅ Подключение к БД успешно!
echo.

echo 2. Выполняем исправления структуры БД...
psql -h localhost -p 5432 -U postgres -d thewho -f "ИСПРАВИТЬ-СТРУКТУРУ-БД.sql"

echo.
echo 3. Замещаем entity файл правильной версией...
copy /Y "backend\src\database\entities\operation.entity.FIXED.ts" "backend\src\database\entities\operation.entity.ts"
echo ✅ Entity файл обновлен

echo.
echo 4. Проверяем операции для C6HP0021A...
psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
    'Заказ: ' || o.drawing_number as info,
    'Операций: ' || COUNT(op.id) as count
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
WHERE o.drawing_number = 'C6HP0021A'
GROUP BY o.drawing_number;"

echo.
echo ====================================
echo ✅ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!
echo ====================================
echo.
echo Теперь перезапустите backend сервер для применения изменений:
echo 1. Остановите текущий backend (Ctrl+C)
echo 2. Запустите: npm run start:dev
echo.
echo Заказ C6HP0021A теперь должен показывать 3 операции!
echo.
pause
