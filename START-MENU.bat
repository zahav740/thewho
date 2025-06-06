@echo off
chcp 65001 >nul
title Production CRM - Меню запуска
color 0E

:menu
cls
echo.
echo ================================================================
echo                  PRODUCTION CRM - МЕНЮ ЗАПУСКА
echo ================================================================
echo.
echo Выберите способ запуска приложения:
echo.
echo 1. 🐘 Запуск с PostgreSQL (рекомендуется для продакшена)
echo    - Требует установленный PostgreSQL
echo    - Полная функциональность
echo    - Лучшая производительность
echo.
echo 2. 🐳 Запуск PostgreSQL в Docker (быстрый старт)
echo    - Требует Docker Desktop
echo    - Автоматическая настройка
echo    - Изолированная среда
echo.
echo 3. 📄 Запуск с SQLite (для разработки)
echo    - Не требует внешних зависимостей
echo    - Файловая база данных
echo    - Быстрый старт
echo.
echo 4. 🔧 Диагностика и исправление проблем
echo    - Проверка PostgreSQL
echo    - Установка зависимостей
echo    - Исправление ошибок
echo.
echo 5. ❌ Выход
echo.
set /p choice="Введите номер (1-5): "

if "%choice%"=="1" goto postgresql
if "%choice%"=="2" goto docker
if "%choice%"=="3" goto sqlite
if "%choice%"=="4" goto diagnostic
if "%choice%"=="5" goto exit
echo Неверный выбор! Попробуйте снова.
timeout /t 2 /nobreak >nul
goto menu

:postgresql
echo.
echo 🐘 Запуск с PostgreSQL...
call start-postgresql.bat
if %ERRORLEVEL% EQU 0 (
    call fix-and-restart.bat
)
goto menu

:docker
echo.
echo 🐳 Запуск PostgreSQL в Docker...
call start-postgres-docker.bat
if %ERRORLEVEL% EQU 0 (
    timeout /t 3 /nobreak >nul
    call fix-and-restart.bat
)
goto menu

:sqlite
echo.
echo 📄 Запуск с SQLite...
call start-with-sqlite.bat
goto menu

:diagnostic
echo.
echo 🔧 Диагностика системы...
echo.
echo Проверяем установленные компоненты:
echo.

REM Проверка Node.js
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js: 
    node --version
) else (
    echo ❌ Node.js не установлен
)

REM Проверка NPM
npm --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ NPM: 
    npm --version
) else (
    echo ❌ NPM не установлен
)

REM Проверка PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL: Доступен
) else (
    echo ❌ PostgreSQL недоступен
)

REM Проверка Docker
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker: 
    docker --version
) else (
    echo ❌ Docker не установлен
)

echo.
echo Проверяем зависимости проекта...
echo.

if exist "backend\node_modules" (
    echo ✅ Backend зависимости: Установлены
) else (
    echo ❌ Backend зависимости: Не установлены
    echo Выполните: cd backend ^&^& npm install
)

if exist "frontend\node_modules" (
    echo ✅ Frontend зависимости: Установлены  
) else (
    echo ❌ Frontend зависимости: Не установлены
    echo Выполните: cd frontend ^&^& npm install
)

echo.
echo 🔧 Хотите установить отсутствующие зависимости? (y/n)
set /p install_deps="Ваш выбор: "
if /i "%install_deps%"=="y" (
    echo.
    echo 📦 Установка зависимостей...
    
    if not exist "backend\node_modules" (
        echo Установка backend зависимостей...
        cd backend
        call npm install
        cd ..
    )
    
    if not exist "frontend\node_modules" (
        echo Установка frontend зависимостей...
        cd frontend  
        call npm install
        cd ..
    )
    
    echo ✅ Зависимости установлены
)

pause
goto menu

:exit
echo.
echo 👋 До свидания!
exit /b 0
