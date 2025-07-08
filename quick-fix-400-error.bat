@echo off
echo 🔧 Быстрое исправление ошибки 400 Bad Request...

REM Проверяем, запущен ли backend
curl -s http://localhost:5100/api/health >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Backend не запущен на порту 5100
    echo 📋 Запустите backend:
    echo   cd backend
    echo   npm run start:dev
    pause
    exit /b 1
)

echo ✅ Backend запущен

REM Применяем миграцию если файл существует
if exist "backend\src\database\migrations\add-soft-delete-to-orders.sql" (
    echo 📋 Применяем миграцию soft delete...
    
    if not "%DB_HOST%"=="" if not "%DB_NAME%"=="" if not "%DB_USER%"=="" (
        echo 🚀 Применяем миграцию к БД...
        if "%DB_PORT%"=="" set DB_PORT=5432
        psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "backend\src\database\migrations\add-soft-delete-to-orders.sql"
        
        if %errorlevel% equ 0 (
            echo ✅ Миграция применена
        ) else (
            echo ⚠️ Миграция не применена, но это не критично
        )
    ) else (
        echo ⚠️ Переменные БД не настроены, пропускаем миграцию
    )
) else (
    echo ⚠️ Файл миграции не найден
)

REM Перезапускаем backend
echo 🔄 Перезапускаем backend...
cd backend

REM Останавливаем если запущен  
taskkill /f /im node.exe >nul 2>nul

REM Ждем немного
timeout /t 2 /nobreak >nul

REM Запускаем заново
echo 🚀 Запускаем backend...
start "Backend" npm run start:dev

REM Ждем запуска
timeout /t 5 /nobreak >nul

REM Проверяем что запустился
curl -s http://localhost:5100/api/health >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend успешно перезапущен
) else (
    echo ❌ Backend не запустился. Проверьте логи:
    echo   cd backend ^&^& npm run start:dev
)

REM Тестируем API заказов
echo 🧪 Тестируем API заказов...
curl -s "http://localhost:5100/api/orders?page=1&limit=5" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ API заказов работает
) else (
    echo ❌ API заказов не работает
    echo 📋 Возможные решения:
    echo   1. Убедитесь что БД запущена
    echo   2. Проверьте переменные окружения
    echo   3. Примените миграцию вручную
)

echo.
echo 🎉 Исправление завершено!
echo 📋 Если проблема остается:
echo   1. Проверьте логи backend: cd backend ^&^& npm run start:dev
echo   2. Примените миграцию: apply-soft-delete-migration.bat
echo   3. Убедитесь что БД доступна

echo.
echo Нажмите любую клавишу для закрытия...
pause >nul
