@echo off
echo ==============================================
echo           БЫСТРАЯ ПРОВЕРКА EXCEL ИМПОРТА
echo ==============================================

cd /d "%~dp0backend"

echo 🔍 Проверяем компиляцию...
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибки компиляции найдены!
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!
echo.
echo 🚀 Запускаем сервер...
echo.
echo Откроется тестовая страница для проверки Excel импорта.
echo Сервер запустится на http://localhost:5100
echo.
echo Доступные тестовые эндпоинты:
echo   📋 GET  /api/excel-test/check-file
echo   🚀 POST /api/excel-test/upload  
echo   🧪 POST /api/excel-simple/test-upload
echo.

start "" "%~dp0TEST-EXCEL-UPLOAD.html"

call npm run start:dev
