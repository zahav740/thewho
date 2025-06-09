@echo off
echo ===============================================
echo 🚀 ЗАПУСК СИСТЕМЫ С НОВЫМ EXCEL ИМПОРТОМ
echo ===============================================

echo.
echo 📋 Проверяем готовность системы...

echo.
echo 🔧 1. Проверяем backend (TypeScript)...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

call npx tsc --noEmit

if errorlevel 1 (
    echo ❌ Ошибки TypeScript в backend!
    pause
    exit /b 1
)

echo ✅ Backend TypeScript проверен успешно!

echo.
echo 🎨 2. Проверяем frontend (TypeScript)...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

call npx tsc --noEmit

if errorlevel 1 (
    echo ⚠️ Возможные ошибки TypeScript в frontend, но продолжаем...
)

echo ✅ Frontend проверен!

echo.
echo 🚀 3. Запускаем backend сервер...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Сборка backend...
call npm run build

if errorlevel 1 (
    echo ❌ Ошибка сборки backend!
    pause
    exit /b 1
)

echo ✅ Backend собран успешно!

start "Production CRM Backend" cmd /k "npm run start:prod"

echo.
echo ⏳ Ждем запуска backend сервера (5 секунд)...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 4. Запускаем frontend приложение...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

start "Production CRM Frontend" cmd /k "npm start"

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА!
echo.
echo 🌐 Доступные адреса:
echo    Frontend: http://localhost:5101 (через ~30 сек)
echo    Backend API: http://localhost:5100
echo    API Docs: http://localhost:5100/api/docs
echo.
echo 📊 Для тестирования нового Excel импорта:
echo    1. Откройте http://localhost:5101
echo    2. Перейдите в раздел "База данных"
echo    3. Нажмите кнопку "Excel 2.0" (новый улучшенный импорт)
echo    4. Выберите файл 2025.xlsx
echo    5. Следуйте инструкциям мастера импорта
echo.
echo 🎯 Новые возможности:
echo    - Детальный анализ Excel файла перед импортом
echo    - Цветовые фильтры (зеленый, желтый, красный, синий)
echo    - Выбор конкретных заказов для импорта
echo    - Каждая строка Excel = отдельный заказ в БД
echo    - Предварительный просмотр всех найденных заказов
echo.

pause
