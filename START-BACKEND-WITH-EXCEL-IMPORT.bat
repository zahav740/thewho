@echo off
echo ===========================================
echo   ЗАПУСК BACKEND С EXCEL IMPORT MODULE
echo ===========================================
echo.

cd /d "%~dp0backend"

echo Проверяем зависимости...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
)

echo.
echo Проверяем подключение к PostgreSQL...
echo База данных: thewho
echo Хост: localhost:5432
echo Пользователь: postgres
echo.

echo Запуск миграций базы данных...
npm run migration:run
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Миграции не выполнены!
    echo Проверьте:
    echo 1. Запущен ли PostgreSQL?
    echo 2. Существует ли база данных 'thewho'?
    echo 3. Правильные ли учетные данные в .env?
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Миграции выполнены успешно!
echo.
echo Запуск backend сервера...
echo Backend будет доступен по адресу: http://localhost:5100
echo API документация (Swagger): http://localhost:5100/api/docs
echo Excel Import API: http://localhost:5100/api/excel-import
echo.

npm run start:dev
