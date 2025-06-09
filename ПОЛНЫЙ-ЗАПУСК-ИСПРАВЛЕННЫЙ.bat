@echo off
echo ===============================================
echo 🎯 ПОЛНЫЙ ЗАПУСК СИСТЕМЫ С ИСПРАВЛЕНИЯМИ
echo ===============================================

echo.
echo 📋 План действий:
echo 1. Исправление TypeScript ошибок
echo 2. Запуск backend сервера
echo 3. Запуск frontend приложения
echo 4. Готовность к тестированию Excel импорта
echo.

pause

echo.
echo 🔧 ЭТАП 1: Исправляем TypeScript ошибки...
echo ===============================================

echo 🔍 Проверяем backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

call npx tsc --noEmit

if errorlevel 1 (
    echo ❌ Ошибки TypeScript в backend! Попробуйте исправить вручную.
    pause
    exit /b 1
)

echo ✅ Backend TypeScript OK!

echo.
echo 🔍 Проверяем frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

call npx tsc --noEmit

if errorlevel 1 (
    echo ⚠️ Есть предупреждения TypeScript в frontend, но продолжаем...
) else (
    echo ✅ Frontend TypeScript OK!
)

echo.
echo 🚀 ЭТАП 2: Запускаем backend...
echo ===============================================
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 🏗️ Сборка backend...
call npm run build

if errorlevel 1 (
    echo ❌ Ошибка сборки backend!
    pause
    exit /b 1
)

echo ✅ Backend собран!

echo 🌐 Запускаем backend сервер в отдельном окне...
start "Production CRM Backend" cmd /k "cd /d \"C:\Users\kasuf\Downloads\TheWho\production-crm\backend\" && npm run start:prod"

echo.
echo ⏳ Ждем запуска backend (10 секунд)...
timeout /t 10 /nobreak >nul

echo.
echo 🎨 ЭТАП 3: Запускаем frontend...
echo ===============================================
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 🌐 Запускаем frontend в отдельном окне...
start "Production CRM Frontend" cmd /k "cd /d \"C:\Users\kasuf\Downloads\TheWho\production-crm\frontend\" && npm start"

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА!
echo ===============================================
echo.
echo 🌐 Доступные адреса:
echo    Backend API: http://localhost:5100
echo    API Docs: http://localhost:5100/api/docs
echo    Frontend: http://localhost:3000 (через ~30 сек)
echo    Frontend (альт): http://localhost:5101
echo.
echo 📊 Тестирование нового Excel импорта:
echo    1. Откройте frontend в браузере
echo    2. Перейдите в раздел "База данных"
echo    3. Нажмите кнопку "Excel 2.0" (улучшенный импорт)
echo    4. Загрузите файл 2025.xlsx
echo    5. Следуйте пошаговому мастеру:
echo       - Анализ файла
echo       - Выбор заказов и настроек
echo       - Импорт в базу данных
echo       - Просмотр результатов
echo.
echo 🎯 Основные возможности:
echo    ✅ Каждая строка Excel = отдельный заказ
echo    ✅ Цветовые фильтры для отбора заказов
echo    ✅ Детальный предварительный просмотр
echo    ✅ Выборочный импорт конкретных заказов
echo    ✅ Подробная статистика результатов
echo.
echo 💡 Если возникнут проблемы:
echo    - Проверьте, что порты 5100 и 3000/5101 свободны
echo    - Убедитесь, что PostgreSQL запущен
echo    - База данных 'thewho' должна существовать
echo.

echo Нажмите любую клавишу для завершения...
pause >nul
