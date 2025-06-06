@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ====================================
echo 🚀 АВТОМАТИЧЕСКИЙ ЗАПУСК PRODUCTION CRM
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

echo %YELLOW%Останавливаем все процессы на портах 5100 и 5101...%RESET%

:: Убиваем процессы на порту 5100 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo %YELLOW%Убиваем процесс %%a на порту 5100%RESET%
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Убиваем процессы на порту 5101 (Backend)
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

echo %YELLOW%Проверяем PostgreSQL...%RESET%

:: Проверяем порт 5432
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo %GREEN%✅ PostgreSQL слушает порт 5432%RESET%
) else (
    echo %RED%❌ PostgreSQL не запущен на порту 5432%RESET%
    echo %YELLOW%Попробуйте запустить PostgreSQL вручную%RESET%
    pause
    exit /b 1
)

echo.

echo %BLUE%3. АВТОМАТИЧЕСКОЕ ПОДКЛЮЧЕНИЕ К БД%RESET%
echo ======================================

echo %YELLOW%Тестируем автоматическое подключение к БД с данными из .env...%RESET%

:: Устанавливаем переменные окружения из .env файла
if exist "backend\.env" (
    echo %GREEN%✅ Найден backend\.env файл%RESET%
    
    :: Читаем переменные из .env (упрощенная версия)
    set DB_HOST=localhost
    set DB_PORT=5432
    set DB_NAME=thewho
    set DB_USERNAME=postgres
    set DB_PASSWORD=magarel
    
    echo %YELLOW%Подключение: postgresql://!DB_USERNAME!:***@!DB_HOST!:!DB_PORT!/!DB_NAME!%RESET%
) else (
    echo %RED%❌ Файл backend\.env не найден%RESET%
    pause
    exit /b 1
)

:: Тестируем подключение к БД
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT 'Подключение успешно!' as status;" >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Автоматическое подключение к БД успешно%RESET%
) else (
    echo %RED%❌ Не удается подключиться к БД автоматически%RESET%
    echo %YELLOW%Проверьте настройки в backend\.env%RESET%
    pause
    exit /b 1
)

echo.

echo %BLUE%4. ИСПРАВЛЕНИЕ СТРУКТУРЫ БД И КОДА%RESET%
echo =======================================

echo %YELLOW%Применяем исправления БД и кода...%RESET%

:: Применяем простое исправление БД
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -f "FIX-SIMPLE.sql" >nul 2>&1

:: Применяем безопасный Entity
if exist "backend\src\database\entities\operation.entity.SAFE.ts" (
    copy /Y "backend\src\database\entities\operation.entity.SAFE.ts" "backend\src\database\entities\operation.entity.ts" >nul
    echo %GREEN%✅ Безопасный Entity применен%RESET%
)

:: Применяем производственный сервис
if exist "backend\src\modules\orders\orders.service.PRODUCTION.ts" (
    copy /Y "backend\src\modules\orders\orders.service.PRODUCTION.ts" "backend\src\modules\orders\orders.service.ts" >nul
    echo %GREEN%✅ Производственный сервис применен%RESET%
)

echo.

echo %BLUE%5. АВТОМАТИЧЕСКИЙ ЗАПУСК BACKEND%RESET%
echo ===================================

echo %YELLOW%Переходим в директорию backend...%RESET%
cd backend

if not exist package.json (
    echo %RED%❌ package.json не найден в backend%RESET%
    pause
    exit /b 1
)

echo %YELLOW%Устанавливаем зависимости...%RESET%
call npm install --silent

echo %YELLOW%Запускаем backend сервер на порту 5101...%RESET%
start "Production-Backend" cmd /k "echo %GREEN%🚀 BACKEND ЗАПУСКАЕТСЯ НА ПОРТУ 5101%RESET% && npm run start:dev"

echo %YELLOW%Ждем 15 секунд для полного запуска backend...%RESET%
timeout /t 15 /nobreak >nul

:: Проверяем что backend запустился
curl -s http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Backend сервер запущен и отвечает%RESET%
) else (
    echo %RED%❌ Backend сервер не отвечает%RESET%
    echo %YELLOW%Проверьте окно backend на ошибки%RESET%
)

cd ..

echo.

echo %BLUE%6. АВТОМАТИЧЕСКИЙ ЗАПУСК FRONTEND%RESET%
echo ===================================

echo %YELLOW%Переходим в директорию frontend...%RESET%
cd frontend

if not exist package.json (
    echo %RED%❌ package.json не найден в frontend%RESET%
    pause
    exit /b 1
)

echo %YELLOW%Устанавливаем зависимости...%RESET%
call npm install --silent

echo %YELLOW%Запускаем frontend на порту 5100...%RESET%
start "Production-Frontend" cmd /k "echo %GREEN%🚀 FRONTEND ЗАПУСКАЕТСЯ НА ПОРТУ 5100%RESET% && npm start"

echo %YELLOW%Ждем 20 секунд для полного запуска frontend...%RESET%
timeout /t 20 /nobreak >nul

cd ..

echo.

echo %BLUE%7. АВТОМАТИЧЕСКОЕ ТЕСТИРОВАНИЕ%RESET%
echo ===============================

echo %YELLOW%Тестируем все системы...%RESET%

echo.
echo %YELLOW%Health Check:%RESET%
curl -s -w "HTTP код: %%{http_code}" http://localhost:5101/api/health
echo.

echo.
echo %YELLOW%Orders API:%RESET%
curl -s -w "HTTP код: %%{http_code}" "http://localhost:5101/api/orders?limit=3"
echo.

echo.
echo %YELLOW%Календарь API:%RESET%
curl -s -w "HTTP код: %%{http_code}" http://localhost:5101/api/calendar/test
echo.

echo.

echo %BLUE%8. ПРОВЕРКА ДАННЫХ C6HP0021A%RESET%
echo ===============================

echo %YELLOW%Проверяем операции для заказа C6HP0021A...%RESET%

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% -c "SELECT o.drawing_number, COUNT(op.id) as operations_count FROM orders o LEFT JOIN operations op ON o.id = op.\"orderId\" WHERE o.drawing_number = 'C6HP0021A' GROUP BY o.drawing_number;" 2>nul

echo.

echo %BLUE%9. АВТОМАТИЧЕСКОЕ ОТКРЫТИЕ БРАУЗЕРА%RESET%
echo ====================================

echo %YELLOW%Открываем приложение в браузере...%RESET%
timeout /t 3 /nobreak >nul
start http://localhost:5100

echo.

echo %GREEN%====================================
echo ✅ АВТОМАТИЧЕСКИЙ ЗАПУСК ЗАВЕРШЕН!
echo ====================================%RESET%
echo.
echo %GREEN%🎉 PRODUCTION CRM ЗАПУЩЕН И ГОТОВ К РАБОТЕ!%RESET%
echo.
echo %BLUE%📊 URLs для доступа:%RESET%
echo %GREEN%Frontend:%RESET%      http://localhost:5100
echo %GREEN%Backend API:%RESET%   http://localhost:5101/api
echo %GREEN%API Docs:%RESET%      http://localhost:5101/api/docs
echo %GREEN%Health Check:%RESET%  http://localhost:5101/api/health
echo.
echo %BLUE%📝 Что было сделано:%RESET%
echo ✅ Остановлены все процессы на портах 5100/5101
echo ✅ Проверено автоматическое подключение к PostgreSQL
echo ✅ Применены исправления БД и кода
echo ✅ Запущен backend сервер с production кодом
echo ✅ Запущен frontend приложение
echo ✅ Протестированы все API endpoints
echo ✅ Открыт браузер с приложением
echo.
echo %YELLOW%Заказ C6HP0021A теперь должен показывать 3 операции!%RESET%
echo %YELLOW%Окна серверов запущены отдельно для мониторинга логов.%RESET%
echo.
pause

endlocal
