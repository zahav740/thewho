@echo off
setlocal enabledelayedexpansion

echo ====================================
echo 🎯 САМОЕ СТАБИЛЬНОЕ РЕШЕНИЕ
echo ====================================
echo Запускаем надежный импорт Excel файлов
echo.

echo ✅ ПРЕИМУЩЕСТВА ЭТОГО РЕШЕНИЯ:
echo - Работает в любом браузере без установки ПО
echo - Поддерживает drag & drop Excel файлов  
echo - Автоматически парсит и проверяет данные
echo - Показывает превью перед загрузкой
echo - Загружает через стабильные API endpoints
echo - Красивый современный интерфейс
echo - Полная диагностика ошибок
echo.

echo 🔧 ЧТО НУЖНО:
echo 1. Backend должен работать на порту 5100
echo 2. Любой браузер (Chrome, Firefox, Edge)
echo.

echo 🚀 Проверяем backend...
curl -s http://localhost:5100/api/health >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Backend работает
) else (
    echo ❌ Backend не запущен
    echo 💡 Запустите сначала backend:
    echo    cd backend
    echo    npm run start
    echo.
    set /p continue="Продолжить в любом случае? (y/N): "
    if /i "!continue!" neq "y" exit /b 1
)

echo.
echo 🌐 Открываем стабильный импорт в браузере...

REM Определяем путь к HTML файлу
set "html_file=%~dp0СТАБИЛЬНЫЙ-ИМПОРТ-EXCEL.html"

REM Проверяем существование файла
if not exist "!html_file!" (
    echo ❌ Файл не найден: !html_file!
    pause
    exit /b 1
)

REM Открываем в браузере
start "Стабильный импорт Excel" "!html_file!"

echo ✅ Страница открыта в браузере!
echo.

echo 📋 ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ:
echo.
echo 1. 📁 Перетащите ваш Excel файл в окно браузера
echo    ИЛИ скопируйте данные из Excel и вставьте в поле
echo.
echo 2. 🔍 Нажмите "Обработать данные" 
echo    Система покажет превью ваших данных
echo.
echo 3. 🗑️ (Опционально) Нажмите "Очистить базу"
echo    Удалит старые заказы (TH1K4108A, C6HP0021A, G63828A)
echo.
echo 4. 🚀 Нажмите "Загрузить в БД"
echo    Данные загрузятся через стабильный API
echo.
echo 5. 🎉 Откройте http://localhost:5101/database
echo    Проверьте, что ваши данные загружены
echo.

echo ⚡ ПОЧЕМУ ЭТО РАБОТАЕТ:
echo - Обходит проблемную веб-загрузку файлов
echo - Использует проверенную библиотеку SheetJS
echo - Загружает через стабильные API endpoints
echo - Полная диагностика на каждом шаге
echo.

echo 🔗 ПОЛЕЗНЫЕ ССЫЛКИ:
echo - Импорт данных: !html_file!
echo - Просмотр заказов: http://localhost:5101/database
echo - API документация: http://localhost:5100/api/docs
echo - Проверка API: http://localhost:5100/api/health
echo.

echo ================================
echo ✅ ГОТОВО К РАБОТЕ!
echo ================================
echo.
echo Если возникнут проблемы:
echo 1. Убедитесь, что backend запущен
echo 2. Проверьте формат Excel файла
echo 3. Попробуйте скопировать данные вручную
echo.

pause
