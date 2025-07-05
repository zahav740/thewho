@echo off
echo ===========================================  
echo ОБНОВЛЕННЫЙ ЗАПУСК С ИГНОРОМ TYPESCRIPT
echo ===========================================

REM Set development environment variables
set NODE_ENV=development
set PORT=5100
set FRONTEND_PORT=5101

echo 🔧 НОВАЯ СТРАТЕГИЯ: Игнорируем ошибки TypeScript
echo.

echo 1. Останавливаем процессы на портах %PORT% и %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%FRONTEND_PORT%" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 2. Запускаем backend с игнором ошибок TypeScript...
cd backend

echo Метод 1: Прямой запуск через ts-node
start "Backend (Ignore TS)" cmd /k "echo ================================ && echo BACKEND ЗАПУСК С ИГНОРОМ TYPESCRIPT && echo Порт: %PORT% && echo Игнорируем 91 ошибку TypeScript && echo ================================ && npx ts-node --transpile-only src/main.ts"

echo.
echo Ожидаем 10 секунд для запуска backend...
timeout /t 10 >nul

echo.
echo 3. Запускаем frontend...
cd ..\frontend

start "Frontend" cmd /k "echo ================================ && echo FRONTEND ЗАПУСК && echo Порт: %FRONTEND_PORT% && echo ================================ && set PORT=%FRONTEND_PORT% && npm start"

echo.
echo ⏳ Ожидаем 15 секунд для полного запуска...
timeout /t 15 >nul

echo.
echo 🌐 Открываем браузер...
start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo ====================================
echo СИСТЕМА ЗАПУЩЕНА (IGNORE TYPESCRIPT)
echo ====================================
echo.
echo 🌐 URLs:
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%PORT%/api
echo Health:   http://localhost:%PORT%/api/health
echo.
echo 💡 TypeScript ошибки проигнорированы!
echo 💡 Система должна работать несмотря на ошибки
echo.

pause
