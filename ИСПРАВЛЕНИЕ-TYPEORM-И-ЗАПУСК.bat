@echo off
echo ========================================
echo   ИСПРАВЛЕНИЕ TYPEORM И ДВОЙНОЙ ЗАГРУЗКИ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🛑 Останавливаем предыдущие процессы...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 🔨 Проверяем TypeScript...
call npx tsc --noEmit

if errorlevel 1 (
    echo ❌ Есть ошибки TypeScript!
    pause
    exit /b 1
)

echo.
echo ✅ TypeScript в порядке!
echo.
echo 🔧 Пересобираем Backend...
call npm run build

if errorlevel 1 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)

echo.
echo ✅ Сборка успешна!
echo.
echo 🚀 Запускаем Backend на порту 5100...
echo.
echo 📊 Доступные сервисы:
echo    ✅ API:     http://localhost:5100/api
echo    ✅ Swagger: http://localhost:5100/api/docs
echo    ✅ Health:  http://localhost:5100/api/health
echo.

start "Frontend" cmd /c "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && npm start"

echo.
echo 🎯 Frontend будет доступен на http://localhost:5101
echo.

call npm run start:dev

pause
