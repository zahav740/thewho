@echo off
REM ================================================
REM БЫСТРЫЙ ЗАПУСК ИСПРАВЛЕННОЙ СИСТЕМЫ PDF (Windows)
REM ================================================
REM Этот скрипт автоматически применяет все исправления
REM и запускает обновленную систему на Windows
REM ================================================

echo 🔧 Начинаем исправление системы PDF...

REM 1. Остановить текущие процессы
echo ⏹️ Остановка текущих процессов...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

REM 2. Создать необходимые папки
echo 📁 Создание структуры папок...
if not exist "backend\uploads\pdf" mkdir backend\uploads\pdf

REM 3. Обновить backend
echo 🔄 Обновление backend...
cd backend

REM Установить зависимости (если нужно)
call npm install

REM Применить SQL скрипт очистки
echo 🗄️ Очистка базы данных...
echo ⚠️ ВНИМАНИЕ: Необходимо выполнить SQL скрипт вручно:
echo    psql -d your_database_name -f src/modules/orders/pdf-system-cleanup.sql
echo    Нажмите любую клавишу после выполнения SQL скрипта...
pause >nul

REM Собрать backend
echo 🔨 Сборка backend...
call npm run build

REM 4. Обновить frontend  
echo 🔄 Обновление frontend...
cd ..\frontend

REM Установить зависимости (если нужно)
call npm install

REM Собрать frontend
echo 🔨 Сборка frontend...
call npm run build

REM 5. Запустить систему
echo 🚀 Запуск обновленной системы...

REM Запуск backend
cd ..\backend
echo ▶️ Запуск backend на порту 5100...
start "Backend Server" cmd /k "npm run start:dev"

REM Ждем запуска backend
timeout /t 5 >nul

REM Запуск frontend  
cd ..\frontend
echo ▶️ Запуск frontend на порту 3000...
start "Frontend Server" cmd /k "npm start"

REM 6. Проверка работоспособности
echo 🔍 Проверка работоспособности...

REM Ждем запуска сервисов
timeout /t 10 >nul

REM Проверяем backend
echo 🌐 Проверка backend API...
curl -s http://localhost:5100/api/orders/pdf/statistics >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend API доступен
) else (
    echo ❌ Backend API недоступен
)

REM Проверяем frontend
echo 🌐 Проверка frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend доступен
) else (
    echo ❌ Frontend недоступен
)

REM 7. Открыть браузер
echo 🌐 Открытие браузера...
start http://localhost:3000

REM 8. Итоговая информация
echo.
echo ================================================
echo 🎉 ИСПРАВЛЕНИЕ СИСТЕМЫ PDF ЗАВЕРШЕНО!
echo ================================================
echo.
echo 📋 Доступные сервисы:
echo    🔗 Frontend: http://localhost:3000
echo    🔗 Backend API: http://localhost:5100/api
echo    🔗 PDF API: http://localhost:5100/api/orders/pdf
echo.
echo 📊 Для проверки статистики PDF выполните:
echo    curl http://localhost:5100/api/orders/pdf/statistics
echo.
echo 🔧 Новые возможности:
echo    ✅ Организация файлов по папкам номера чертежа
echo    ✅ Проверка и обработка дубликатов  
echo    ✅ Drag ^& Drop загрузка PDF
echo    ✅ Множественные режимы просмотра
echo    ✅ Автоматическая очистка устаревших данных
echo.
echo 📁 Структура файлов:
echo    uploads/pdf/E-25142-000-266000/document.pdf
echo    uploads/pdf/DWG-12345/assembly.pdf
echo.
echo 🛑 Для остановки закройте окна серверов или нажмите Ctrl+C в них
echo.
echo 💡 Логи серверов отображаются в отдельных окнах командной строки
echo.
echo ================================================
echo Система готова к работе! 🚀
echo ================================================
echo.
echo 📝 Для тестирования:
echo 1. Откройте http://localhost:3000
echo 2. Создайте или отредактируйте заказ
echo 3. Перейдите на вкладку "PDF Документация"
echo 4. Загрузите PDF файл через Drag ^& Drop
echo 5. Проверьте отображение в превью
echo.
echo 🎯 При возникновении проблем проверьте:
echo - Логи в окнах серверов
echo - Доступность портов 3000 и 5100
echo - Права доступа к папке uploads
echo - Подключение к базе данных
echo.

pause
