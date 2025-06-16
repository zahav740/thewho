@echo off
chcp 65001 > nul
title Production CRM - Запуск с синхронизацией

echo.
echo 🔥 Запуск Production CRM с полной синхронизацией...
echo.
echo ✨ Новые возможности:
echo    🔄 Автоматическая синхронизация Production ↔ Shifts
echo    📡 Real-time обновления
echo    📊 Мониторинг прогресса в реальном времени
echo    🎯 Автоматическое создание смен при назначении операций
echo.

REM Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден. Установите Node.js для продолжения.
    pause
    exit /b 1
)

echo 1️⃣ Запуск Backend...
cd backend

REM Устанавливаем зависимости если нужно
if not exist "node_modules" (
    echo 📦 Установка зависимостей backend...
    call npm install
)

echo 🚀 Запуск Backend на порту 5100...
start /B cmd /c "npm run start:dev"

echo ⏳ Ожидание запуска backend...
timeout /t 10 /nobreak >nul

REM Проверяем что backend запущен
curl -s "http://localhost:5100/api/health" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend запущен успешно
) else (
    echo ❌ Ошибка запуска backend
    echo    Проверьте что PostgreSQL запущен и доступен
    pause
    exit /b 1
)

echo.
echo 2️⃣ Запуск Frontend...
cd ..\frontend

REM Устанавливаем зависимости если нужно
if not exist "node_modules" (
    echo 📦 Установка зависимостей frontend...
    call npm install
)

echo 🚀 Запуск Frontend на порту 3000...
start /B cmd /c "npm start"

echo ⏳ Ожидание запуска frontend...
timeout /t 15 /nobreak >nul

echo.
echo ✅ Система запущена!
echo.
echo 🌐 Доступные ссылки:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5100/api
echo    API Docs: http://localhost:5100/api/docs
echo.
echo 🎯 Тестирование синхронизации:
echo    1. Откройте Production: http://localhost:3000/production
echo    2. Откройте Shifts: http://localhost:3000/shifts
echo    3. Выберите операцию в Production
echo    4. Проверьте автоматическое появление в Shifts
echo    5. Заполните объем в Shifts
echo    6. Проверьте обновление в Production
echo.
echo 🧪 Автоматический тест:
echo    ТЕСТ-СИНХРОНИЗАЦИИ.bat
echo.
echo 📚 Документация:
echo    ДОКУМЕНТАЦИЯ-СИНХРОНИЗАЦИИ.md
echo.

REM Открываем браузер
echo 🌐 Открытие браузера...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo 🔄 Система работает. Нажмите любую клавишу для остановки.
pause >nul

echo.
echo 🛑 Остановка системы...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ Система остановлена
echo.
pause
