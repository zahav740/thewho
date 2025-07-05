@echo off
echo ====================================
echo    ПРОВЕРКА СТАТУСА ПОРТОВ
echo ====================================
echo.

echo 🔍 Проверяем порт 5100 (Backend)...
netstat -ano | findstr :5100
if %errorlevel% equ 0 (
    echo ✅ Порт 5100 занят
) else (
    echo ❌ Порт 5100 свободен
)

echo.
echo 🔍 Проверяем порт 5101 (Frontend)...
netstat -ano | findstr :5101
if %errorlevel% equ 0 (
    echo ✅ Порт 5101 занят
) else (
    echo ❌ Порт 5101 свободен
)

echo.
echo ====================================
echo      ТЕКУЩАЯ КОНФИГУРАЦИЯ
echo ====================================
echo Backend должен быть на: 5100
echo Frontend должен быть на: 5101
echo.

echo 🔗 Попытка подключения к Backend...
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend доступен на http://localhost:5100/api
) else (
    echo ❌ Backend недоступен на http://localhost:5100/api
)

echo.
pause
