@echo off
echo ==============================================
echo КОМПИЛЯЦИЯ И ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ
echo ==============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 1. Компиляция TypeScript...
npm run build

if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: Компиляция не удалась!
    pause
    exit /b 1
)

echo.
echo 2. Перезапуск сервера...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

start "Backend Server" cmd /k "npm run start:prod"

echo.
echo 3. Ожидание запуска сервера...
timeout /t 5

echo.
echo 4. Проверка работы сервера...
curl -X GET "http://localhost:3001/api/machines" -H "accept: application/json"

echo.
echo.
echo ==============================================
echo BACKEND ПЕРЕЗАПУЩЕН
echo Теперь можно тестировать планирование!
echo ==============================================
pause
