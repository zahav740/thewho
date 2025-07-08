@echo off
title PRODUCTION CRM - CLEAN RESTART
cd /d "%~dp0"

echo.
echo ===================================
echo   PRODUCTION CRM - ПОЛНАЯ ОЧИСТКА
echo ===================================
echo.

echo 🛑 1. Останавливаем все процессы...
taskkill /f /im node.exe 2>nul >nul
taskkill /f /im npm.exe 2>nul >nul
timeout /t 2 >nul

echo 🔌 2. Освобождаем порты 5100 и 5101...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5100" 2^>nul') do (
    taskkill /f /pid %%a 2>nul >nul
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5101" 2^>nul') do (
    taskkill /f /pid %%a 2>nul >nul
)

echo 🗑️ 3. Очищаем все кэши...
if exist node_modules\.cache (
    echo    - Удаляем node_modules\.cache...
    rmdir /s /q node_modules\.cache
)
if exist .eslintcache (
    echo    - Удаляем .eslintcache...
    del .eslintcache
)
if exist build (
    echo    - Удаляем build...
    rmdir /s /q build
)

echo 🧹 4. Очищаем npm кэш...
npm cache clean --force >nul 2>&1

echo ⚙️ 5. Устанавливаем переменные окружения...
set NODE_ENV=development
set REACT_APP_ENVIRONMENT=development
set REACT_APP_API_URL=http://localhost:5100/api
set PORT=5101
set BROWSER=none
set SKIP_PREFLIGHT_CHECK=true
set GENERATE_SOURCEMAP=true

echo.
echo 📊 Настройки:
echo    NODE_ENV: %NODE_ENV%
echo    REACT_APP_API_URL: %REACT_APP_API_URL%  
echo    PORT: %PORT%
echo.

echo 🚀 6. Запускаем frontend...
echo.
echo ⚠️  ВАЖНО: 
echo    - Backend должен быть запущен на порту 5100
echo    - Откройте http://localhost:5101 в браузере
echo.

npm start

echo.
echo ❌ Frontend остановлен
pause