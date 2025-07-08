@echo off
echo ============================================
echo   ПРОСТОЙ ЗАПУСК BACKEND
echo ============================================
echo.

cd /d "%~dp0backend"

REM Проверяем, установлен ли PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL не запущен или недоступен!
    echo.
    echo Запустите PostgreSQL:
    echo 1. Через службы Windows
    echo 2. Или командой: net start postgresql-x64-14
    echo 3. Или через pgAdmin
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL доступен

REM Создаем базу данных если её нет
echo 🗄️ Проверяем базу данных...
psql -U postgres -lqt | cut -d ^| -f 1 | findstr /c:"thewho" >nul
if %ERRORLEVEL% NEQ 0 (
    echo 📝 Создаем базу данных 'thewho'...
    psql -U postgres -c "CREATE DATABASE thewho;" 2>nul
)

echo ✅ База данных готова

echo.
echo 🏗️ Создаем таблицы...
npx typeorm migration:run

echo.
echo 🚀 Запускаем backend...
set PORT=5100
set NODE_ENV=development

REM Запускаем напрямую через ts-node для избежания проблем с dist
npx ts-node -r tsconfig-paths/register src/main.ts
