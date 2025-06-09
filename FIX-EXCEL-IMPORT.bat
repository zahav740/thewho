@echo off
echo ===========================================
echo 🔧 ИСПРАВЛЕНИЕ EXCEL ИМПОРТА
echo ===========================================

echo.
echo 📁 Создаем необходимые директории...
if not exist "backend\uploads\excel" mkdir "backend\uploads\excel"

echo.
echo 🔄 Перезапускаем backend для применения изменений...
cd backend
taskkill /f /im node.exe 2>nul
echo.
echo 🚀 Запускаем backend...
start "Backend Server" cmd /k "npm run start:dev"

echo.
echo ⏳ Ждем 10 секунд для полного запуска...
timeout /t 10 /nobreak

echo.
echo 🧪 Тестируем Excel endpoint...
curl -X POST http://localhost:5100/api/orders/upload-excel -F "excel=@test.xlsx" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Excel endpoint доступен!
) else (
    echo ❌ Excel endpoint недоступен
)

echo.
echo ===========================================
echo 🏁 Исправление завершено!
echo ===========================================
echo.
echo 💡 Теперь попробуйте загрузить Excel файл через интерфейс
echo.
pause
