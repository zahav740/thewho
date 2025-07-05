@echo off
echo ========================================
echo ДИАГНОСТИКА ПРОБЛЕМ EXCEL ИМПОРТА
echo ========================================
echo.

echo 🔧 1. Перезапуск системы для устранения двойной загрузки...
echo.

cd frontend
echo 📱 Останавливаем фронтенд...
taskkill /f /im node.exe 2>nul

cd ..\backend
echo 🔌 Останавливаем бэкенд...
taskkill /f /im node.exe 2>nul

timeout /t 3 /nobreak >nul

echo.
echo 🧹 Очищаем кэш...
cd ..\frontend
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

cd ..\backend
if exist "dist" rmdir /s /q "dist"

echo.
echo 🚀 Перезапускаем систему...
echo ⚡ Backend на порту 5100...
cd backend
start "Backend (5100)" cmd /k "set PORT=5100 && npm run start:dev"

timeout /t 5 /nobreak >nul

echo 🎨 Frontend на порту 5101...
cd ..\frontend
start "Frontend (5101)" cmd /k "set PORT=5101 && npm start"

echo.
echo ✅ Система перезапущена!
echo.
echo 🔍 Для диагностики Excel импорта:
echo    1. Откройте http://localhost:5101
echo    2. Перейдите в раздел "Заказы"
echo    3. Нажмите "Excel импорт"
echo    4. Загрузите Excel файл
echo    5. Проверьте консоль браузера (F12)
echo.
echo 📋 В консоли должны появиться сообщения:
echo    - "📊 Данные из Excel: Object"
echo    - "📋 Количество строк для обработки: X"
echo    - "📝 Парсинг строки 1: Чертёж=..."
echo.
echo Нажмите любую клавишу для завершения...
pause >nul
