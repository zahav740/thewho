@echo off
chcp 65001 >nul
echo ==========================================
echo     PRODUCTION CRM - STOP PRODUCTION
echo ==========================================
echo.

echo ⏹️  Остановка Production CRM системы...
echo.

REM Остановка всех Node.js процессов
echo 🔄 Остановка backend процессов...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "npm.cmd" >nul 2>&1

REM Остановка serve процессов
echo 🔄 Остановка frontend процессов...
taskkill /f /im "serve.cmd" >nul 2>&1

REM Поиск и остановка процессов на портах 3000 и 3001
echo 🔄 Освобождение портов 3000 и 3001...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

timeout /t 3 /nobreak >nul

REM Проверка что порты свободны
echo 🧪 Проверка портов...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Порт 3000 все еще занят
) else (
    echo ✅ Порт 3000 свободен
)

netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Порт 3001 все еще занят
) else (
    echo ✅ Порт 3001 свободен
)

echo.
echo ==========================================
echo    🛑 PRODUCTION CRM ОСТАНОВЛЕН
echo ==========================================
echo.
echo ✅ Все процессы остановлены
echo ✅ Порты освобождены
echo.
echo Для запуска используйте: START-PRODUCTION-CRM.bat
echo.
pause
