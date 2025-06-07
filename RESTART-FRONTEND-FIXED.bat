@echo off
echo ==============================================
echo КОМПИЛЯЦИЯ И ПЕРЕЗАПУСК FRONTEND С ИСПРАВЛЕНИЯМИ JSX
echo ==============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 1. Проверка TypeScript компиляции...
npx tsc --noEmit

if %ERRORLEVEL% neq 0 (
    echo ОШИБКА: TypeScript компиляция не удалась!
    pause
    exit /b 1
)

echo.
echo 2. Перезапуск фронтенда...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

start "Frontend Server" cmd /k "npm start"

echo.
echo 3. Ожидание запуска фронтенда...
timeout /t 10

echo.
echo 4. Открытие браузера...
start http://localhost:3000/planning

echo.
echo.
echo ==============================================
echo FRONTEND ПЕРЕЗАПУЩЕН
echo JSX ошибка исправлена!
echo ==============================================
pause
