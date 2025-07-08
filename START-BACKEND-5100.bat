@echo off
echo ===================================
echo     ЗАПУСК BACKEND СЕРВЕРА
echo ===================================
echo.

cd /d "%~dp0"

echo Переход в директорию backend...
cd backend

echo.
echo Проверка файла package.json...
if not exist package.json (
    echo ❌ Файл package.json не найден!
    pause
    exit /b 1
)

echo.
echo Установка зависимостей...
npm install

echo.
echo Проверка файла .env...
if not exist .env (
    echo ⚠️ Файл .env не найден, создаем из примера...
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo ❌ Файл .env.example не найден!
        echo Создайте файл .env с настройками базы данных
        pause
        exit /b 1
    )
)

echo.
echo Компиляция TypeScript...
npm run build
if %errorlevel% neq 0 (
    echo ⚠️ Есть ошибки компиляции, но продолжаем...
)

echo.
echo ===================================
echo    ЗАПУСК BACKEND НА ПОРТУ 5100
echo ===================================
echo.

echo Запускаем backend сервер...
npm run start:dev

pause
