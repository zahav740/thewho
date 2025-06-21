@echo off
title Сборка мобильной версии для Beget
color 0A

echo.
echo ========================================
echo     СБОРКА МОБИЛЬНОЙ ВЕРСИИ ДЛЯ BEGET
echo ========================================
echo.

REM Переходим в директорию frontend
cd /d "%~dp0frontend"

echo [1/8] Проверка зависимостей...
if not exist node_modules (
    echo Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo ОШИБКА: Не удалось установить зависимости
        pause
        exit /b 1
    )
)

echo [2/8] Копирование конфигурации для production...
copy /Y "..\..env.beget.mobile" ".env.production"

echo [3/8] Очистка предыдущих сборок...
if exist build rmdir /s /q build
if exist build-mobile rmdir /s /q build-mobile

echo [4/8] Сборка React приложения...
call npm run build
if errorlevel 1 (
    echo ОШИБКА: Сборка не удалась
    pause
    exit /b 1
)

echo [5/8] Создание мобильной версии...
mkdir build-mobile
xcopy /E /I build build-mobile

echo [6/8] Копирование мобильных файлов...
copy /Y mobile-styles.css build-mobile\static\css\
copy /Y mobile-logic.js build-mobile\static\js\
copy /Y public\mobile-styles.css build-mobile\
copy /Y public\mobile-logic.js build-mobile\

echo [7/8] Оптимизация для мобильных...
REM Добавляем mobile viewport meta в index.html
powershell -Command "(Get-Content 'build-mobile\index.html') -replace '<meta name=\"viewport\"[^>]*>', '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover\">' | Set-Content 'build-mobile\index.html'"

REM Добавляем preload для мобильных файлов
powershell -Command "(Get-Content 'build-mobile\index.html') -replace '</head>', '<link rel=\"preload\" href=\"/mobile-styles.css\" as=\"style\"><link rel=\"preload\" href=\"/mobile-logic.js\" as=\"script\"></head>' | Set-Content 'build-mobile\index.html'"

echo [8/8] Создание архива для загрузки на Beget...
cd build-mobile
tar -czf ..\frontend-mobile-beget.tar.gz *
cd ..

echo.
echo ========================================
echo     СБОРКА ЗАВЕРШЕНА УСПЕШНО!
echo ========================================
echo.
echo Файл для загрузки на Beget:
echo %~dp0frontend\frontend-mobile-beget.tar.gz
echo.
echo Директория var/upload на Beget:
echo 1. Распакуйте frontend-mobile-beget.tar.gz
echo 2. Поместите файлы в директорию /var/upload
echo 3. Настройте веб-сервер на обслуживание статических файлов
echo.
echo Мобильные функции:
echo ✓ Адаптивный дизайн
echo ✓ Touch-friendly интерфейс  
echo ✓ Мобильное меню
echo ✓ Pull-to-refresh
echo ✓ Floating Action Buttons
echo ✓ Swipe actions
echo ✓ Оптимизация производительности
echo.

pause
