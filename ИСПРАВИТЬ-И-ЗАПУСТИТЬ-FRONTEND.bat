@echo off
echo ===============================================
echo  БЫСТРОЕ ИСПРАВЛЕНИЕ И ЗАПУСК FRONTEND
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 1. Устанавливаем зависимости...
call npm install

echo.
echo 2. Проверяем TypeScript...
call npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКИ TYPESCRIPT НАЙДЕНЫ!
    echo Попробуйте запустить этот файл еще раз или исправьте ошибки вручную.
    pause
    exit /b 1
)

echo.
echo ✅ TypeScript ошибки исправлены!

echo.
echo 3. Запускаем фронтенд...
start "Frontend Development Server" cmd /k "npm start"

echo.
echo ✅ Frontend запущен на http://localhost:3000
echo.
echo Если браузер не открылся автоматически, откройте:
echo http://localhost:3000
echo.
pause
