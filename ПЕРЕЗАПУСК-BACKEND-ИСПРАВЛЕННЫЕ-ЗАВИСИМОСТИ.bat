@echo off
echo ========================================
echo   ИСПРАВЛЕНИЕ ЗАВИСИМОСТЕЙ NESTJS
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔧 Останавливаем предыдущий процесс...
taskkill /f /im node.exe 2>nul

echo.
echo 🔨 Пересобираем проект...
call npm run build

if errorlevel 1 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)

echo.
echo ✅ Сборка успешна!
echo.
echo 🚀 Запускаем Backend с исправленными зависимостями...
echo Backend: http://localhost:5100/api
echo Swagger: http://localhost:5100/api/docs
echo.

call npm run start:dev

pause
