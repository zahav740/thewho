@echo off
echo ========================================
echo   ИСПРАВЛЕНИЕ КОНТРОЛЛЕРА V2
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
rmdir /s /q dist 2>nul
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
echo 📊 Исправления:
echo    ✅ Убран OrdersService из контроллера
echo    ✅ Упрощены зависимости модуля
echo    ✅ TypeScript ошибки исправлены
echo    ✅ TypeORM совместимость
echo.
echo 🌐 Доступные сервисы:
echo    ✅ API:     http://localhost:5100/api
echo    ✅ Swagger: http://localhost:5100/api/docs
echo    ✅ Health:  http://localhost:5100/api/health
echo.

call npm run start:dev

pause
