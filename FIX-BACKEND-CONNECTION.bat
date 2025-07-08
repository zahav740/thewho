@echo off
echo ===================================
echo   ИСПРАВЛЕНИЕ ПРОБЛЕМЫ BACKEND API
echo ===================================
echo.

cd /d "%~dp0"

echo Проблема: Frontend не может подключиться к backend на порту 5100
echo Решение: Запускаем backend сервер
echo.

echo Шаг 1: Диагностика...
call DIAGNOSE-BACKEND.bat

echo.
echo Шаг 2: Переход в директорию backend...
cd backend

echo.
echo Шаг 3: Проверка зависимостей...
if not exist node_modules (
    echo Устанавливаем зависимости...
    npm install
)

echo.
echo Шаг 4: Проверка базы данных...
echo Подключение: postgresql://postgres:magarel@localhost:5432/thewho

echo.
echo Шаг 5: Запуск backend сервера...
echo ===================================
echo    BACKEND ЗАПУСКАЕТСЯ НА ПОРТУ 5100
echo ===================================
echo.
echo После запуска проверьте:
echo - http://localhost:5100/api/health
echo - http://localhost:5100/api/docs
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

npm run start:dev
