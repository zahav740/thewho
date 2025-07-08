@echo off
echo ============================================
echo   BACKEND ЗАПУСК БЕЗ КОМПИЛЯЦИИ (TS-NODE)
echo ============================================
echo.

cd /d "%~dp0backend"

REM Убиваем старые процессы
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 📦 Проверяем зависимости...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
)

echo.
echo 🗄️ Миграции базы данных...
echo Создаем таблицы если их нет...

REM Используем прямой вызов TypeORM
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ormconfig.ts

echo.
echo 🚀 Запускаем backend через ts-node (без компиляции)...
echo ✅ Backend: http://localhost:5100
echo ✅ API Docs: http://localhost:5100/api/docs
echo ✅ Health: http://localhost:5100/api/health
echo.

set PORT=5100
set NODE_ENV=development

REM Запускаем напрямую через ts-node
npx ts-node -r tsconfig-paths/register src/main.ts
