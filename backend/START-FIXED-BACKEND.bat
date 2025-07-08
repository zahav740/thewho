@echo off
echo ===========================================
echo ЗАПУСК BACKEND С ИСПРАВЛЕННЫМ КОНТРОЛЛЕРОМ
echo ===========================================

echo.
echo [1/4] Проверка директории...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
echo Текущая директория: %CD%

echo.
echo [2/4] Проверка package.json...
if exist package.json (
    echo ✅ package.json найден
) else (
    echo ❌ package.json не найден!
    pause
    exit /b 1
)

echo.
echo [3/4] Проверка TypeScript файлов...
echo Проверяем operation-completion.controller.ts...
if exist "src\modules\operations\operation-completion.controller.ts" (
    echo ✅ Контроллер найден
) else (
    echo ❌ Контроллер не найден!
    pause
    exit /b 1
)

echo.
echo [4/4] Запуск backend...
echo Порт: 5100 (production)
echo База данных: postgresql://postgres:magarel@localhost:5432/thewho
echo.

set NODE_ENV=production
set PORT=5100
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres  
set DB_PASSWORD=magarel
set DB_NAME=thewho

echo PRODUCTION BACKEND STARTING ON PORT 5100...
echo Database: postgresql://postgres:magarel@localhost:5432/thewho
echo Environment: production
echo.

npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ОШИБКА ЗАПУСКА BACKEND!
    echo Проверьте логи выше для диагностики.
    pause
) else (
    echo.
    echo ✅ BACKEND УСПЕШНО ЗАПУЩЕН!
)

pause
