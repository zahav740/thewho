@echo off
chcp 65001 >nul
echo =====================================================
echo  🚀 PRODUCTION BACKEND STARTER v2.0 (Supabase)
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

:: Устанавливаем переменные окружения для production
set NODE_ENV=production
set PORT=5100
set HOST=0.0.0.0

echo 📋 Переменные окружения:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%
echo HOST=%HOST%
echo.

echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⬇️ Установка зависимостей...
    call UPDATE-DEPENDENCIES.bat
)

echo.
echo 🧪 Запуск теста подключения к локальной PostgreSQL...
node test-local-postgresql.js

echo.
echo 🔨 Сборка приложения...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка при сборке!
    echo Попробуйте:
    echo 1. Удалить папку dist: rmdir /s dist
    echo 2. Проверить TypeScript ошибки
    echo 3. Запустить: npm install
    pause
    exit /b 1
)

echo.
echo ✅ Сборка успешна! Запуск production сервера...
echo 🌐 Server будет доступен на: http://localhost:5100
echo 📚 API docs: http://localhost:5100/api/docs
echo 💚 Health check: http://localhost:5100/api/health
echo.
echo 🔗 Подключение к локальной PostgreSQL...
echo Host: localhost:5432
echo Database: thewho
echo.
echo 🚀 Запуск с улучшенной конфигурацией подключения...

npm run start:prod

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка запуска! Попытка альтернативного запуска...
    node dist/src/main.js
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Альтернативный запуск тоже не сработал!
        echo.
        echo 🔧 Попробуйте:
        echo 1. Обновить зависимости: UPDATE-DEPENDENCIES.bat
        echo 2. Проверить подключение: TEST-SUPABASE-CONNECTION.bat
        echo 3. Проверить переменные в .env.production
        echo 4. Перезапустить Supabase проект
        pause
    )
)

echo.
echo 💡 Для остановки нажмите Ctrl+C
pause
