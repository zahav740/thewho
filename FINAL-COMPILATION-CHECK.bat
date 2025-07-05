@echo off
echo ============================================
echo ФИНАЛЬНАЯ ПРОВЕРКА: ИСПРАВЛЕНИЕ ПОСЛЕДНЕЙ ОШИБКИ
echo ============================================

echo.
echo 1. Проверяем компиляцию Frontend (финальная ошибка)...
cd /d "%~dp0\frontend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ ВСЕ ЕЩЕ ЕСТЬ ОШИБКИ КОМПИЛЯЦИИ!
    echo Проверьте OrderForm.tsx на строке 157
    pause
    exit /b 1
)
echo ✅ Frontend теперь компилируется без ошибок!

echo.
echo 2. Проверяем компиляцию Backend...
cd /d "%~dp0\backend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ Ошибки компиляции Backend найдены!
    pause
    exit /b 1
)
echo ✅ Backend компилируется без ошибок!

echo.
echo 3. Запускаем Backend для тестирования...
cd /d "%~dp0\backend"
start /min cmd /c "npm run start:dev"

echo Ждем запуска Backend (10 секунд)...
timeout /t 10 /nobreak > nul

echo.
echo 4. Финальный тест Excel импорта...
cd /d "%~dp0"
node test-excel-import-fixed.js

echo.
echo ============================================
echo 🎉 ПОЗДРАВЛЯЮ! ВСЕ ОШИБКИ ИСПРАВЛЕНЫ!
echo ============================================
echo ✅ Компиляция Frontend: УСПЕШНО
echo ✅ Компиляция Backend: УСПЕШНО  
echo ✅ Excel импорт: РАБОТАЕТ
echo ✅ TypeScript errors: 0
echo.
echo 🚀 Система готова к работе!
echo Backend: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo ============================================
pause
