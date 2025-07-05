@echo off
echo ==========================================
echo ТЕСТ ИСПРАВЛЕННОГО EXCEL ИМПОРТА V2
echo ==========================================

cd /d "%~dp0"

echo.
echo 1. Проверяем наличие Excel файла...
if not exist "2025 june.xlsx" (
    echo ❌ ОШИБКА: Файл "2025 june.xlsx" не найден!
    echo Убедитесь что файл находится в корне проекта.
    pause
    exit /b 1
)
echo ✅ Excel файл найден

echo.
echo 2. Проверяем backend...
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend не доступен на порту 5100
    echo Запустите backend командой: START-BACKEND-FIXED-V2.bat
    pause
    exit /b 1
)
echo ✅ Backend работает на порту 5100

echo.
echo 3. Проверяем зависимости для теста...
if not exist "node_modules" (
    echo Устанавливаем зависимости...
    call npm install
)

echo.
echo 4. Запускаем тест Excel импорта...
echo ==========================================
node test-excel-import-fixed.js

echo.
echo ==========================================
echo ТЕСТ ЗАВЕРШЕН
echo ==========================================
pause
