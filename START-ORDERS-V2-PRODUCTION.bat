@echo off
echo ====================================
echo    PRODUCTION ORDERS V2 SYSTEM
echo ====================================
echo.
echo 🎯 Правильные продакшен порты:
echo Backend:  5100
echo Frontend: 5101
echo.

echo [STEP 1/5] Проверка конфигурации...
if not exist backend\src\main.ts (
    echo ❌ Backend не найден!
    pause
    exit
)

if not exist frontend\package.json (
    echo ❌ Frontend не найден!
    pause
    exit
)

echo ✅ Структура проекта корректна

echo.
echo [STEP 2/5] Проверка портов...
netstat -ano | findstr :5100 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Порт 5100 уже используется
    echo Останавливаем процесс на порту 5100...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :5101 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Порт 5101 уже используется  
    echo Останавливаем процесс на порту 5101...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do taskkill /PID %%a /F >nul 2>&1
)

echo ✅ Порты свободны

echo.
echo [STEP 3/5] Настройка Frontend...
cd /d "%~dp0frontend"
if not exist .env (
    echo 📝 Создаем .env файл...
    echo PORT=5101 > .env
    echo REACT_APP_API_URL=http://localhost:5100/api >> .env
    echo ✅ .env файл создан
) else (
    echo ✅ .env файл существует
)

echo.
echo [STEP 4/5] Запуск Backend на порту 5100...
cd /d "%~dp0backend"
start "Backend Orders V2 (Port 5100)" cmd /k "echo 🚀 BACKEND ORDERS V2 && echo Port: 5100 && echo API: http://localhost:5100/api/v2/orders && echo Swagger: http://localhost:5100/api/docs && echo. && npm run start:dev"
timeout /t 8 /nobreak > nul

echo [STEP 5/5] Запуск Frontend на порту 5101...
cd /d "%~dp0frontend"
start "Frontend Orders V2 (Port 5101)" cmd /k "echo 🌐 FRONTEND ORDERS V2 && echo Port: 5101 && echo URL: http://localhost:5101/orders && echo. && npm start"
timeout /t 3 /nobreak > nul

echo.
echo ====================================
echo        ✅ СИСТЕМА ЗАПУЩЕНА!
echo ====================================
echo.
echo 🌐 ДОСТУП К СИСТЕМЕ:
echo Frontend:     http://localhost:5101/orders
echo Backend API:  http://localhost:5100/api/v2/orders  
echo Swagger:      http://localhost:5100/api/docs
echo Health:       http://localhost:5100/api/health
echo.
echo 🧪 ТЕСТИРОВАНИЕ:
echo 1. Откройте http://localhost:5101/orders
echo 2. Создайте новый заказ с автоматическим приоритетом
echo 3. Загрузите test-orders-v2.xlsx для тестирования
echo 4. Проверьте умную сортировку и приоритеты
echo.
echo 📋 ОСОБЕННОСТИ V2:
echo ✅ Исправлена загрузка Excel (колонки C, E, G, K)
echo ✅ Автоматические приоритеты по дедлайнам
echo ✅ Позиционная сортировка (1-3 красные, 4-10 оранжевые)
echo ✅ Стабильная работа с БД
echo ✅ Пошаговый импорт с предпросмотром
echo.
echo 🔧 УПРАВЛЕНИЕ:
echo Для остановки системы закройте оба окна (Ctrl+C)
echo Логи backend и frontend отображаются в отдельных окнах
echo.
pause
