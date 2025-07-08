@echo off
echo ============================================
echo   ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ
echo ============================================
echo.

cd /d "%~dp0backend"

REM Останавливаем текущий процесс
echo 🛑 Останавливаем текущий backend...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ Исправлены типы данных для PostgreSQL:
echo    - longblob → bytea
echo    - longtext → text
echo.

echo 🗄️ Запускаем миграции с исправленными типами...
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ormconfig.ts

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка миграции! 
    echo Возможно нужно удалить таблицу excel_files и пересоздать:
    echo.
    echo psql -U postgres -d thewho -c "DROP TABLE IF EXISTS excel_files CASCADE;"
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Запускаем backend с исправлениями...
echo ✅ Backend: http://localhost:5100
echo ✅ API Docs: http://localhost:5100/api/docs
echo ✅ Excel Import: http://localhost:5100/api/excel-import
echo.

set PORT=5100
set NODE_ENV=development

npx ts-node -r tsconfig-paths/register src/main.ts
