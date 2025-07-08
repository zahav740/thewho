@echo off
echo =====================================================
echo  BACKEND ЗАПУСК С ПРАВИЛЬНЫМИ КОМАНДАМИ (PRODUCTION)
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

:: Устанавливаем переменные окружения для production
set NODE_ENV=production
set PORT=5100
set HOST=0.0.0.0

echo Загрузка переменных окружения из .env.production...
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%

echo Проверка установки зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
)

echo.
echo Сборка приложения...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка при сборке!
    pause
    exit /b 1
)

echo.
echo Попытка 1: Запуск production через npm run start:prod...
npm run start:prod
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ npm run start:prod не сработал
    echo.
    echo Попытка 2: Прямой запуск скомпилированного кода...
    node dist/src/main.js
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Прямой запуск не сработал
        echo.
        echo Попытка 3: Запуск через TypeScript...
        npx ts-node -r tsconfig-paths/register src/main.ts
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo ❌ Все попытки неудачны!
            echo.
            echo Проверьте что:
            echo 1. Node.js установлен правильно
            echo 2. База данных Supabase доступна
            echo 3. Переменные окружения в .env.production корректны
            echo 4. SSL соединение работает
            echo.
            echo Детали подключения к БД:
            echo Host: aws-0-eu-central-1.pooler.supabase.com
            echo Port: 6543
            echo Database: postgres
            echo.
            pause
        )
    )
)
