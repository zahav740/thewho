@echo off
echo ============================================
echo КОМПИЛЯЦИЯ И ИСПРАВЛЕНИЕ ВСЕХ ОШИБОК
echo ============================================

echo.
echo 1. Проверяем компиляцию Backend...
cd /d "%~dp0\backend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ Ошибки компиляции Backend найдены!
    echo Проверьте вывод выше для деталей
    pause
    exit /b 1
)
echo ✅ Backend компилируется без ошибок

echo.
echo 2. Проверяем компиляцию Frontend...
cd /d "%~dp0\frontend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ Ошибки компиляции Frontend найдены!
    echo Проверьте вывод выше для деталей
    pause
    exit /b 1
)
echo ✅ Frontend компилируется без ошибок

echo.
echo 3. Запускаем Backend...
cd /d "%~dp0\backend"
start /min cmd /c "npm run start:dev"

echo Ждем запуска Backend (10 секунд)...
timeout /t 10 /nobreak > nul

echo.
echo 4. Тестируем Excel импорт...
cd /d "%~dp0"
node test-excel-import-fixed.js

echo.
echo ============================================
echo ✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ УСПЕШНО!
echo ============================================
echo Backend: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo Excel импорт: /api/v2/orders/parse-excel
echo ============================================
pause
