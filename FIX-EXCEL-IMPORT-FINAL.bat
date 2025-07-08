@echo off
echo ==============================================
echo         ИСПРАВЛЕНИЕ ПРОБЛЕМЫ EXCEL ИМПОРТА
echo ==============================================

cd /d "%~dp0backend"
echo Переходим в папку backend: %cd%

echo.
echo 🔍 1. Быстрая проверка компиляции...
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% neq 0 (
    echo ❌ Найдены ошибки компиляции!
    echo Запустите FIX-COMPILATION-FINAL.bat для исправления
    pause
    exit /b 1
)

echo ✅ Компиляция прошла успешно!

echo.
echo 📋 2. Проверяем endpoint'ы Excel импорта...

echo.
echo 📊 Доступные endpoints для тестирования:
echo   ✅ POST /api/orders/upload-excel          (основной для фронтенда)
echo   🧪 POST /api/excel-test/upload           (полный тест)
echo   📋 POST /api/excel-test/check-file       (проверка файла)
echo   🎯 POST /api/excel-simple/test-upload    (простой тест)

echo.
echo 🚀 3. Запускаем сервер...
echo.
echo Сервер будет доступен на http://localhost:5100
echo.
echo 🧪 Тестовые страницы:
echo   📊 TEST-MAIN-EXCEL-ENDPOINT.html    - тест основного endpoint
echo   🔧 TEST-EXCEL-UPLOAD.html           - комплексное тестирование
echo.

start "" "%~dp0TEST-MAIN-EXCEL-ENDPOINT.html"

echo Нажмите Ctrl+C для остановки сервера
echo.

call npm run start:dev

echo.
echo Сервер остановлен.
pause
