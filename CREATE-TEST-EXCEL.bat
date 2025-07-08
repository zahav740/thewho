@echo off
echo ===================================
echo    СОЗДАНИЕ ТЕСТОВЫХ EXCEL ФАЙЛОВ
echo ===================================
echo.

cd /d "%~dp0"

echo Проверка наличия Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js.
    pause
    exit /b 1
)

echo.
echo Установка exceljs...
npm install exceljs --save-dev

echo.
echo Создание тестовых Excel файлов...
node create-test-excel.js

echo.
echo ===================================
echo    ФАЙЛЫ СОЗДАНЫ
echo ===================================
echo.
echo Созданы файлы:
echo - test-excel-data.xlsx (малый файл)
echo - test-excel-large-data.xlsx (большой файл)
echo.
echo Используйте эти файлы для тестирования загрузки в систему.
echo.
pause
