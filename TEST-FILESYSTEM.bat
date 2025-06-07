@echo off
echo ========================================
echo ТЕСТИРОВАНИЕ ФАЙЛОВОЙ СИСТЕМЫ ЗАКАЗОВ
echo ========================================
echo.

set SERVER_URL=http://localhost:5100

echo 🔍 Проверяем доступность backend...
curl -s %SERVER_URL%/api/orders >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend недоступен на %SERVER_URL%
    echo.
    echo Попробуем порт 5101...
    set SERVER_URL=http://localhost:5101
    curl -s %SERVER_URL%/api/orders >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Backend недоступен и на 5101
        echo Запустите backend командой: START-BACKEND-ONLY.bat
        pause
        exit /b 1
    )
)

echo ✅ Backend доступен на %SERVER_URL%
echo.

echo 📊 1. Получаем статистику файловой системы...
curl -s %SERVER_URL%/api/orders/filesystem/statistics/overview
echo.
echo.

echo 📋 2. Получаем список всех заказов в файловой системе...
curl -s %SERVER_URL%/api/orders/filesystem
echo.
echo.

echo 🔧 3. Получаем заказ TH1K4108A...
curl -s %SERVER_URL%/api/orders/filesystem/TH1K4108A
echo.
echo.

echo 📅 4. Получаем версии заказа TH1K4108A...
curl -s %SERVER_URL%/api/orders/filesystem/TH1K4108A/versions
echo.
echo.

echo 🚀 5. Запускаем экспорт всех заказов из БД...
curl -X POST %SERVER_URL%/api/orders/filesystem/export-all
echo.
echo.

echo ✅ Тестирование завершено!
pause
