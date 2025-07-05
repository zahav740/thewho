@echo off
echo ========================================
echo   ИСПРАВЛЕННЫЕ ПОРТЫ - ЗАПУСК СИСТЕМЫ
echo ========================================
echo Backend: http://localhost:5100/api
echo Frontend: http://localhost:5101
echo Swagger: http://localhost:5100/api/docs
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔧 Проверяем и устанавливаем зависимости...
call npm install

echo.
echo 🔧 Устанавливаем xlsx (если нужно)...
call npm install xlsx @types/xlsx

echo.
echo 🔨 Проверяем компиляцию TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка компиляции! Исправьте ошибки и попробуйте снова.
    pause
    exit /b 1
)

echo.
echo ✅ Компиляция успешна!
echo.
echo 🚀 Запускаем Backend на порту 5100...
call npm run start:dev

pause
