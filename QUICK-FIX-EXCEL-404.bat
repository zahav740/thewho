@echo off
echo ====================================
echo БЫСТРОЕ ИСПРАВЛЕНИЕ 404 EXCEL API
echo ====================================

echo.
echo 🔧 Исправляем ошибку 404 для Excel Import API...

echo.
echo [1/3] Останавливаем backend...
taskkill /F /IM node.exe 2>nul
timeout /t 3

echo.
echo [2/3] Очищаем кэш и пересобираем...
cd backend
if exist dist rmdir /s /q dist
npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции! Проверьте код.
    pause
    exit /b 1
)

echo.
echo [3/3] Запускаем backend и тестируем...
start "Backend" cmd /k "npm run start:dev"

echo Ждем 10 секунд пока backend запустится...
timeout /t 10

echo.
echo 🧪 Тестируем API...
cd ..
node test-excel-api.js

echo.
echo ====================================
echo ГОТОВО! Проверьте результаты выше
echo ====================================
echo.
echo Если видите ✅ - API работает
echo Если видите ❌ - нужна дополнительная диагностика
echo.
echo 📋 Откройте: http://localhost:3000/database
echo 🎯 Нажмите: "Excel Маппер"
echo.
pause
