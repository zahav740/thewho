@echo off
chcp 65001 >nul
title Production CRM - Запуск с SQLite
color 0C

echo.
echo ================================================================
echo             PRODUCTION CRM - ЗАПУСК С SQLITE
echo ================================================================
echo.
echo 🔄 Переключаемся на SQLite вместо PostgreSQL...
echo.

set PROJECT_ROOT=C:\Users\Alexey\Downloads\TheWho\production-crm\backend

cd /d "%PROJECT_ROOT%"

echo 📦 Устанавливаем SQLite зависимости...
call npm install sqlite3 @types/sqlite3 --save

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка установки SQLite
    pause
    exit /b 1
)

echo ✅ SQLite зависимости установлены

echo.
echo 🔄 Создаем резервную копию app.module.ts...
copy "src\app.module.ts" "src\app.module.postgres.backup" >nul 2>&1

echo 🔄 Переключаемся на SQLite конфигурацию...
copy "src\app.module.sqlite.ts" "src\app.module.ts" >nul 2>&1

echo ✅ Конфигурация изменена на SQLite

echo.
echo 🚀 Запускаем backend с SQLite...
echo.
echo 📁 База данных будет создана как: production_crm.db
echo 🔄 Используется автоматическая синхронизация схемы
echo.

start "Production CRM Backend (SQLite)" cmd /k "npm run start:dev"

echo ✅ Backend запущен в отдельном окне
echo.
echo 🔄 Ожидание запуска backend...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Запускаем frontend...
cd /d "%PROJECT_ROOT%\..\frontend"
start "Production CRM Frontend" cmd /k "npm start"

echo ✅ Frontend запущен в отдельном окне
echo.
echo ================================================================
echo                    ЗАПУСК ЗАВЕРШЕН
echo ================================================================
echo.
echo 🎯 Приложение запущено с SQLite:
echo.
echo 🔗 Backend:  http://localhost:3000
echo 🔗 Frontend: http://localhost:3001 (откроется автоматически)
echo 📁 База данных: production_crm.db
echo.
echo 💡 Преимущества SQLite:
echo ✅ Не требует установки PostgreSQL
echo ✅ Файловая база данных
echo ✅ Автоматическое создание таблиц
echo ✅ Подходит для разработки и тестирования
echo.
echo 🔄 Для возврата к PostgreSQL:
echo copy "src\app.module.postgres.backup" "src\app.module.ts"
echo.
pause
