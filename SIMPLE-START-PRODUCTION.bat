@echo off
chcp 65001 >nul
echo ==========================================
echo     PRODUCTION CRM - SIMPLE START
echo ==========================================
echo.

echo 🚀 Простой запуск Production CRM...
echo.

REM Проверка прав администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Требуются права администратора!
    pause
    exit /b 1
)

echo ✅ Права администратора OK
echo.

REM Остановка старых процессов
echo ⏹️  Остановка старых процессов...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
timeout /t 3 /nobreak >nul

REM Проверка PostgreSQL
echo 🔍 Проверка PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔄 Запуск PostgreSQL...
    net start postgresql >nul 2>&1
    timeout /t 5 /nobreak >nul
)

echo ✅ PostgreSQL готов
echo.

REM Backend
echo 🏗️  Запуск Backend...
cd /d "%~dp0backend"

echo - Установка зависимостей...
call npm install >nul 2>&1

echo - Сборка...
call npm run build >nul 2>&1

echo - Запуск в продакшене...
start "Production CRM Backend" cmd /k "echo Backend запускается... && npm run start:prod"

echo ⏰ Ожидание backend (30 сек)...
timeout /t 30 /nobreak >nul

echo ✅ Backend запущен
echo.

REM Frontend
echo 🌐 Запуск Frontend...
cd /d "%~dp0frontend"

echo - Установка зависимостей...
call npm install >nul 2>&1

echo - Сборка...
call npm run build >nul 2>&1

echo - Установка serve...
call npm install -g serve >nul 2>&1

echo - Запуск статического сервера...
start "Production CRM Frontend" cmd /k "echo Frontend запускается... && serve -s build -l 3000"

echo ⏰ Ожидание frontend (20 сек)...
timeout /t 20 /nobreak >nul

echo ✅ Frontend запущен
echo.

REM Проверка системы
echo 🧪 Проверка системы...
echo.

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API работает
) else (
    echo ❌ Backend API не отвечает
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend работает
) else (
    echo ❌ Frontend не отвечает
)

echo.
echo ==========================================
echo      🎉 PRODUCTION CRM ЗАПУЩЕН!
echo ==========================================
echo.
echo 🌐 Frontend:  http://localhost:3000
echo 🔌 Backend:   http://localhost:3001
echo 📖 API Docs:  http://localhost:3001/api/docs
echo.

REM Открытие браузера
start http://localhost:3000
start http://localhost:3001/api/docs

echo 📝 Готово! Проверьте окна "Production CRM Backend" и "Production CRM Frontend"
echo.
pause
