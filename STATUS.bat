@echo off
echo ====================================
echo 📊 СТАТУС PRODUCTION CRM
echo ====================================
echo.

echo 🔍 Проверка портов...
echo.

:: Проверяем порт 5100 (Frontend)
netstat -ano | findstr :5100 >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend работает на порту 5100
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
        echo    PID: %%a
    )
) else (
    echo ❌ Frontend не запущен на порту 5100
)

:: Проверяем порт 5101 (Backend)  
netstat -ano | findstr :5101 >nul
if %errorlevel% equ 0 (
    echo ✅ Backend работает на порту 5101
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
        echo    PID: %%a
    )
) else (
    echo ❌ Backend не запущен на порту 5101
)

:: Проверяем PostgreSQL
netstat -ano | findstr :5432 >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL работает на порту 5432
) else (
    echo ❌ PostgreSQL не запущен на порту 5432
)

echo.
echo 🌐 Проверка API endpoints...
echo.

:: Проверяем Health
curl -s -m 5 http://localhost:5101/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Health API отвечает
    curl -s -w "   Статус: %%{http_code}" http://localhost:5101/api/health
    echo.
) else (
    echo ❌ Health API не отвечает
)

:: Проверяем Orders
curl -s -m 5 "http://localhost:5101/api/orders?limit=1" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Orders API отвечает
    curl -s -w "   Статус: %%{http_code}" "http://localhost:5101/api/orders?limit=1"
    echo.
) else (
    echo ❌ Orders API не отвечает или возвращает ошибку
)

:: Проверяем Frontend
curl -s -m 5 http://localhost:5100 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend доступен
) else (
    echo ❌ Frontend недоступен
)

echo.
echo 📋 Быстрые команды:
echo.
echo Полный запуск:     AUTO-START-PRODUCTION.bat
echo Остановить все:    STOP-ALL.bat
echo Статус (этот):     STATUS.bat
echo.
echo 🌐 URLs приложения:
echo Frontend:  http://localhost:5100
echo Backend:   http://localhost:5101/api
echo API Docs:  http://localhost:5101/api/docs
echo.
pause
