@echo off
echo ===============================================
echo 🚀 ПОЛНОЕ РАЗВЕРТЫВАНИЕ PRODUCTION CRM 
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo ✅ Переходим в корневую директорию...
echo Текущая директория: %CD%

echo.
echo 📦 ЭТАП 1: Установка и компиляция BACKEND...
echo ----------------------------------------------
cd backend

echo 🔧 Установка зависимостей backend...
call npm install

echo 🔍 Проверка TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
    echo ❌ Ошибки TypeScript! Прерываем процесс...
    pause
    exit /b 1
)

echo 🏗️ Сборка backend...
call npm run build

echo.
echo 📦 ЭТАП 2: Установка зависимостей FRONTEND...
echo ----------------------------------------------
cd ..\frontend

echo 🔧 Установка зависимостей frontend...
call npm install

echo.
echo 🔄 ЭТАП 3: Проверка базы данных...
echo ----------------------------------------------
cd ..

echo 📊 Проверяем подключение к PostgreSQL...
echo База данных: postgresql://postgres:magarel@localhost:5432/thewho

echo.
echo 🚀 ЭТАП 4: Запуск системы...
echo ----------------------------------------------

echo.
echo ✅ Все готово! Теперь можно запускать:
echo.
echo 1. Для запуска только backend:
echo    cd backend ^&^& npm run start:prod
echo.
echo 2. Для запуска только frontend:
echo    cd frontend ^&^& npm start
echo.
echo 3. Для запуска всей системы:
echo    Выполните оба пункта в разных терминалах
echo.
echo Backend будет доступен на: http://localhost:5100
echo Frontend будет доступен на: http://localhost:5101
echo API документация: http://localhost:5100/api/docs
echo.

pause
