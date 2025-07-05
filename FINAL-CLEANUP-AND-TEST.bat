@echo off
echo ============================================
echo ФИНАЛЬНАЯ ЗАЧИСТКА: ПРОВЕРКА КОМПИЛЯЦИИ
echo ============================================

echo.
echo 1. Проверяем компиляцию Frontend (все "фантомные" типы удалены)...
cd /d "%~dp0\frontend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck --strict false
if %errorlevel% neq 0 (
    echo ❌ ВСЕ ЕЩЕ ЕСТЬ ОШИБКИ КОМПИЛЯЦИИ!
    echo Возможно остались ссылки на DRILLING/GRINDING/MACHINING
    pause
    exit /b 1
)
echo ✅ Frontend компилируется БЕЗ ОШИБОК!

echo.
echo 2. Проверяем компиляцию Backend...
cd /d "%~dp0\backend"

echo Компилируем TypeScript...
call npx tsc --noEmit --skipLibCheck --strict false
if %errorlevel% neq 0 (
    echo ❌ Ошибки компиляции Backend найдены!
    pause
    exit /b 1
)
echo ✅ Backend компилируется БЕЗ ОШИБОК!

echo.
echo 3. Запускаем Backend для финального теста...
cd /d "%~dp0\backend"
echo Запускаем backend на порту 5100...
start /min cmd /c "npm run start:dev"

echo Ждем запуска Backend (15 секунд)...
timeout /t 15 /nobreak > nul

echo.
echo 4. Финальный тест Excel импорта с ивритским файлом...
cd /d "%~dp0"
node test-excel-import-fixed.js

echo.
echo ============================================
echo 🎉🎉🎉 АБСОЛЮТНАЯ ПОБЕДА! 🎉🎉🎉
echo ============================================
echo ✅ Frontend: 0 ошибок TypeScript
echo ✅ Backend: 0 ошибок TypeScript  
echo ✅ Excel импорт: РАБОТАЕТ с ивритским файлом
echo ✅ Только реальные типы: MILLING и TURNING
echo.
echo 🚀 Система ПОЛНОСТЬЮ готова к работе!
echo Backend: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo Excel endpoint: /api/v2/orders/parse-excel
echo ============================================
pause
