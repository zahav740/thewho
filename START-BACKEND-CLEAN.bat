@echo off
echo ============================================
echo   ОЧИСТКА И ЗАПУСК BACKEND НА ПОРТУ 5100
echo ============================================
echo.

cd /d "%~dp0backend"

echo 🧹 Очищаем проблемные файлы...

REM Останавливаем все процессы Node.js (осторожно!)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

REM Ждем немного
timeout /t 2 /nobreak >nul

REM Удаляем папку dist принудительно
echo 🗑️ Удаляем папку dist...
if exist dist (
    rmdir /s /q dist 2>nul
    if exist dist (
        echo ⚠️ Не удалось удалить dist, пытаемся переименовать...
        move dist dist_old_%RANDOM% >nul 2>&1
    )
)

REM Очищаем node_modules при необходимости
if "%1"=="--clean" (
    echo 🧹 Полная очистка node_modules...
    if exist node_modules rmdir /s /q node_modules
    npm install
)

echo.
echo 📦 Проверяем зависимости...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
)

echo.
echo 🗄️ Создаем таблицы в базе данных...
npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка при создании таблиц!
    echo Проверьте:
    echo 1. PostgreSQL запущен
    echo 2. База данных 'thewho' создана
    echo 3. Настройки в .env файле
    echo.
    echo Попробуйте создать базу вручную:
    echo psql -U postgres -c "CREATE DATABASE thewho;"
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Запускаем backend сервер на порту 5100...
echo ✅ Backend будет доступен на: http://localhost:5100
echo ✅ Swagger API документация: http://localhost:5100/api/docs
echo ✅ Excel Import API: http://localhost:5100/api/excel-import
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

set PORT=5100
set NODE_ENV=development

REM Используем более простой способ запуска
npm run start

REM Если не получилось, пробуем альтернативный способ
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Обычный запуск не удался, пробуем альтернативный...
    npx nest start
)
