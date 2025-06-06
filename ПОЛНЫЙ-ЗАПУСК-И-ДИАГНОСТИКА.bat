@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ====================================
echo 🚀 ПОЛНЫЙ ЗАПУСК PRODUCTION CRM
echo ====================================
echo.

:: Цвета для вывода
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo %BLUE%1. ОСТАНОВКА СУЩЕСТВУЮЩИХ ПРОЦЕССОВ%RESET%
echo =====================================

echo %YELLOW%Останавливаем процессы на портах 5100 и 5101...%RESET%

:: Находим и убиваем процессы на порту 5100
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo %YELLOW%Убиваем процесс %%a на порту 5100%RESET%
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Находим и убиваем процессы на порту 5101
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
    if not "%%a"=="0" (
        echo %YELLOW%Убиваем процесс %%a на порту 5101%RESET%
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo %GREEN%✅ Процессы остановлены%RESET%
echo.

echo %BLUE%2. ПРОВЕРКА POSTGRESQL%RESET%
echo =======================

echo %YELLOW%Проверяем подключение к PostgreSQL...%RESET%

:: Проверяем что PostgreSQL запущен
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ PostgreSQL сервис найден%RESET%
) else (
    echo %RED%❌ PostgreSQL сервис не найден%RESET%
    echo %YELLOW%Попробуйте запустить PostgreSQL вручную%RESET%
)

:: Проверяем порт 5432
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo %GREEN%✅ PostgreSQL слушает порт 5432%RESET%
) else (
    echo %RED%❌ PostgreSQL не слушает порт 5432%RESET%
)

echo.

echo %BLUE%3. ПРОВЕРКА БАЗЫ ДАННЫХ%RESET%
echo ===========================

echo %YELLOW%Проверяем подключение к базе данных 'thewho'...%RESET%

:: Используем psql для проверки подключения
psql -h localhost -p 5432 -U postgres -d thewho -c "\dt" >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Подключение к базе данных успешно%RESET%
    
    echo %YELLOW%Проверяем таблицы...%RESET%
    psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>nul
    
    echo %YELLOW%Проверяем операции для заказа C6HP0021A...%RESET%
    psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT o.drawing_number, op.sequence_number, op.operation_type, op.machine, op.status FROM orders o LEFT JOIN operations op ON o.id = op.order_id WHERE o.drawing_number = 'C6HP0021A' ORDER BY op.sequence_number;" 2>nul
    
) else (
    echo %RED%❌ Не удается подключиться к базе данных%RESET%
    echo %YELLOW%Проверьте что:
    - PostgreSQL запущен
    - База данных 'thewho' существует  
    - Пользователь 'postgres' с паролем 'magarel'%RESET%
    pause
    exit /b 1
)

echo.

echo %BLUE%4. ЗАПУСК BACKEND СЕРВЕРА%RESET%
echo =============================

echo %YELLOW%Переходим в директорию backend...%RESET%
cd backend

if not exist package.json (
    echo %RED%❌ package.json не найден в директории backend%RESET%
    pause
    exit /b 1
)

echo %YELLOW%Проверяем .env файл...%RESET%
if exist .env (
    echo %GREEN%✅ .env файл найден%RESET%
    echo %YELLOW%Содержимое .env:%RESET%
    type .env
) else (
    echo %RED%❌ .env файл не найден%RESET%
)

echo.
echo %YELLOW%Устанавливаем зависимости (если нужно)...%RESET%
call npm install --silent

echo.
echo %YELLOW%Запускаем backend сервер на порту 5101...%RESET%
start "Backend Server" cmd /k "echo %GREEN%🚀 BACKEND ЗАПУСКАЕТСЯ%RESET% && npm run start:dev"

echo %YELLOW%Ждем 10 секунд для запуска backend...%RESET%
timeout /t 10 /nobreak >nul

:: Проверяем что backend запустился
curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Backend сервер запущен успешно%RESET%
) else (
    echo %RED%❌ Backend сервер не отвечает%RESET%
    echo %YELLOW%Проверьте окно backend сервера на ошибки%RESET%
)

cd ..

echo.

echo %BLUE%5. ЗАПУСК FRONTEND ПРИЛОЖЕНИЯ%RESET%
echo ================================

echo %YELLOW%Переходим в директорию frontend...%RESET%
cd frontend

if not exist package.json (
    echo %RED%❌ package.json не найден в директории frontend%RESET%
    pause
    exit /b 1
)

echo %YELLOW%Устанавливаем зависимости (если нужно)...%RESET%
call npm install --silent

echo.
echo %YELLOW%Запускаем frontend приложение на порту 5100...%RESET%
start "Frontend App" cmd /k "echo %GREEN%🚀 FRONTEND ЗАПУСКАЕТСЯ%RESET% && npm start"

echo %YELLOW%Ждем 15 секунд для запуска frontend...%RESET%
timeout /t 15 /nobreak >nul

cd ..

echo.

echo %BLUE%6. ТЕСТИРОВАНИЕ API%RESET%
echo ===================

echo %YELLOW%Проверяем API endpoints...%RESET%

echo.
echo %YELLOW%Health check:%RESET%
curl -s -w "\nHTTP код: %%{http_code}\n" http://localhost:5101/api/health

echo.
echo %YELLOW%Тест календаря:%RESET%
curl -s -w "\nHTTP код: %%{http_code}\n" http://localhost:5101/api/calendar/test

echo.
echo %YELLOW%Тест заказов:%RESET%
curl -s -w "\nHTTP код: %%{http_code}\n" "http://localhost:5101/api/orders?limit=5"

echo.
echo %YELLOW%Тест машин:%RESET%
curl -s -w "\nHTTP код: %%{http_code}\n" http://localhost:5101/api/machines

echo.

echo %BLUE%7. ДИАГНОСТИКА ОПЕРАЦИЙ%RESET%
echo ===========================

echo %YELLOW%Проверяем операции в базе данных...%RESET%

psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
    'Всего заказов:' as info, 
    COUNT(*) as count 
FROM orders
UNION ALL
SELECT 
    'Всего операций:' as info, 
    COUNT(*) as count 
FROM operations
UNION ALL  
SELECT 
    'Заказ C6HP0021A:' as info,
    COUNT(*) as count
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
WHERE o.drawing_number = 'C6HP0021A';" 2>nul

echo.
echo %YELLOW%Детальная информация по заказу C6HP0021A:%RESET%

psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
    o.id as order_id,
    o.drawing_number,
    o.quantity,
    o.priority,
    op.id as operation_id,
    op.sequence_number,
    op.operation_type,
    op.machine,
    op.estimated_time,
    op.status,
    op.created_at
FROM orders o 
LEFT JOIN operations op ON o.id = op.order_id 
WHERE o.drawing_number = 'C6HP0021A'
ORDER BY op.sequence_number;" 2>nul

echo.

echo %BLUE%8. РЕЗУЛЬТАТ ЗАПУСКА%RESET%
echo =======================

echo %GREEN%✅ ЗАПУСК ЗАВЕРШЕН!%RESET%
echo.
echo %YELLOW%URLs для доступа:%RESET%
echo %BLUE%Frontend:%RESET% http://localhost:5100
echo %BLUE%Backend API:%RESET% http://localhost:5101/api
echo %BLUE%API Docs:%RESET% http://localhost:5101/api/docs
echo %BLUE%Health Check:%RESET% http://localhost:5101/api/health
echo.
echo %YELLOW%Окна с логами серверов запущены отдельно.%RESET%
echo %YELLOW%Проверьте их на ошибки если что-то не работает.%RESET%
echo.
echo %YELLOW%Если проблемы с операциями - проверьте данные выше.%RESET%
echo.
pause

endlocal
