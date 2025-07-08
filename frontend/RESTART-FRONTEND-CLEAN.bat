@echo off
cd /d "%~dp0"
echo ===================================
echo ОЧИСТКА И ПЕРЕЗАПУСК FRONTEND
echo ===================================

echo.
echo 1. Останавливаем процессы на портах 5101...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5101"') do (
    taskkill /f /pid %%a 2>nul
)

echo.
echo 2. Очищаем npm кэш...
npm cache clean --force

echo.
echo 3. Очищаем node_modules кэш...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 4. Устанавливаем переменные окружения для разработки...
set NODE_ENV=development
set REACT_APP_ENVIRONMENT=development
set REACT_APP_API_URL=http://localhost:5100/api
set PORT=5101

echo.
echo 5. Запускаем frontend...
echo API URL: %REACT_APP_API_URL%
echo PORT: %PORT%
echo.

npm start

pause