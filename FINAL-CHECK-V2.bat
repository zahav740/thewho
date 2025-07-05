@echo off
echo ====================================
echo   ФИНАЛЬНАЯ ПРОВЕРКА ORDERS V2
echo ====================================
echo.

echo [1/3] Проверка Backend компиляции...
cd /d "%~dp0backend"
echo Компиляция TypeScript...
npx tsc --noEmit --skipLibCheck
if %errorlevel% equ 0 (
    echo ✅ Backend компилируется без ошибок
) else (
    echo ❌ Найдены ошибки в Backend
    echo Детали:
    npx tsc --noEmit --skipLibCheck 2>&1 | findstr "error"
    pause
    exit /b 1
)

echo.
echo [2/3] Проверка Frontend компиляции...
cd /d "%~dp0frontend"
echo Компиляция TypeScript...
npx tsc --noEmit --skipLibCheck
if %errorlevel% equ 0 (
    echo ✅ Frontend компилируется без ошибок
) else (
    echo ❌ Найдены ошибки в Frontend
    echo Детали:
    npx tsc --noEmit --skipLibCheck 2>&1 | findstr "error"
    pause
    exit /b 1
)

echo.
echo [3/3] Проверка React компиляции...
echo Тестовая сборка React приложения...
timeout /t 2 /nobreak > nul
npm run build > build_test.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ React приложение собирается без ошибок
    del build_test.log 2>nul
) else (
    echo ❌ Ошибки при сборке React
    echo Детали в build_test.log
    type build_test.log | findstr "error\|Error\|ERROR"
    pause
    exit /b 1
)

echo.
echo ====================================
echo   🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!
echo ====================================
echo.
echo ✅ Backend TypeScript: OK
echo ✅ Frontend TypeScript: OK  
echo ✅ React Build: OK
echo.
echo 🚀 Система готова к запуску!
echo.
echo Команды для запуска:
echo 1. ./START-ORDERS-V2.bat - Полный запуск системы
echo 2. node create-test-excel-v2.js - Создать тестовый Excel
echo.
pause
