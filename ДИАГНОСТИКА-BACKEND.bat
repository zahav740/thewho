@echo off
chcp 65001 > nul
echo.
echo 🔧 ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ПРОБЛЕМ BACKEND
echo ==========================================
echo.

cd /d "%~dp0"

echo 📁 Переходим в backend...
cd backend

echo.
echo 🔍 Проверяем файлы конфигурации...

if exist ".env" (
    echo ✅ .env найден
    echo 📋 Содержимое .env:
    type .env
) else (
    echo ❌ .env НЕ НАЙДЕН!
    echo 🔧 Создаем базовый .env...
    (
        echo NODE_ENV=development
        echo PORT=5100
        echo DB_TYPE=sqlite
        echo DB_DATABASE=./database.sqlite
        echo JWT_SECRET=your-super-secret-jwt-key-here
        echo CORS_ORIGIN=http://localhost:5101
    ) > .env
    echo ✅ Базовый .env создан
)

echo.
echo 📋 Проверяем package.json...
if exist "package.json" (
    echo ✅ package.json найден
) else (
    echo ❌ package.json НЕ НАЙДЕН!
    pause
    exit /b 1
)

echo.
echo 🔍 Проверяем зависимости...
if exist "node_modules" (
    echo ✅ node_modules найден
    echo 📦 Проверяем критические пакеты...
    
    if exist "node_modules\@nestjs\core" (
        echo ✅ NestJS установлен
    ) else (
        echo ❌ NestJS не найден, переустанавливаем...
        call npm install
    )
) else (
    echo ❌ node_modules не найден
    echo 📦 Устанавливаем зависимости...
    call npm install
)

echo.
echo 🔧 Проверяем TypeScript...
npx tsc --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ TypeScript не найден
    echo 📦 Устанавливаем TypeScript...
    npm install -g typescript ts-node
)

echo.
echo 🗄️ Проверяем базу данных...
if exist "database.sqlite" (
    echo ✅ База данных SQLite найдена
) else (
    echo ⚠️ База данных не найдена, будет создана при запуске
)

echo.
echo 🔍 Финальная проверка компиляции...
npx tsc --noEmit
if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript компиляция успешна!
    echo.
    echo 🚀 Можно запускать backend:
    echo   npx ts-node --transpile-only src/main.ts
    echo.
    echo Или используйте: ЗАПУСК-BACKEND-ПОРТ-5100.bat
) else (
    echo ❌ Есть ошибки TypeScript!
    echo 🔧 Попробуйте запустить исправления сначала
)

echo.
pause
