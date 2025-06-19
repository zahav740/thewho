@echo off
echo =====================================================
echo  BACKEND ЗАПУСК С ПРАВИЛЬНЫМИ КОМАНДАМИ
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Проверка установки зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
)

echo.
echo Попытка 1: Запуск через npm run start:dev...
npm run start:dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ npm run start:dev не сработал
    echo.
    echo Попытка 2: Запуск через npx...
    npx nest start --watch
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ npx nest не сработал
        echo.
        echo Попытка 3: Установка NestJS CLI глобально...
        npm install -g @nestjs/cli
        echo.
        echo Попытка 4: Запуск через глобальный nest...
        nest start --watch
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo ❌ Все попытки неудачны!
            echo Проверьте что:
            echo 1. Node.js установлен
            echo 2. PostgreSQL запущен
            echo 3. Нет проблем с правами
            pause
        )
    )
)
