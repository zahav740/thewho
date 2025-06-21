@echo off
cd /d "%~dp0"
echo ===================================
echo ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ КЭШЕЙ
echo ===================================

echo.
echo 1. Останавливаем все процессы Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul

echo.
echo 2. Очищаем порты 5100 и 5101...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100"') do (
    taskkill /f /pid %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5101"') do (
    taskkill /f /pid %%a 2>nul
)

echo.
echo 3. Удаляем все кэши...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .eslintcache del .eslintcache
npm cache clean --force

echo.
echo 4. Удаляем build папку...
if exist build rmdir /s /q build

echo.
echo 5. Принудительно устанавливаем переменные окружения...
set NODE_ENV=development
set REACT_APP_ENVIRONMENT=development  
set REACT_APP_API_URL=http://localhost:5100/api
set PORT=5101
set FORCE_COLOR=1

echo.
echo 6. Показываем текущие переменные...
echo NODE_ENV: %NODE_ENV%
echo REACT_APP_API_URL: %REACT_APP_API_URL%
echo PORT: %PORT%

echo.
echo 7. Запускаем frontend с принудительной перекомпиляцией...
npm start

pause