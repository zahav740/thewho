@echo off
echo ===========================================
echo 🔍 БЫСТРАЯ ДИАГНОСТИКА BACKEND
echo ===========================================

echo.
echo 📡 Проверяем backend на порту 5100...
curl -s -m 5 http://localhost:5100/api/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend доступен на порту 5100!
) else (
    echo ❌ Backend НЕ доступен на порту 5100!
    echo.
    echo 🚀 Попытка запуска backend...
    cd backend
    echo Запускаем: npm run start:dev
    start "Backend Server" cmd /k "npm run start:dev"
    cd ..
    echo.
    echo ⏳ Подождите 15 секунд для полного запуска backend...
    timeout /t 15 /nobreak >nul
    echo.
    echo 🔄 Проверяем снова...
    curl -s -m 5 http://localhost:5100/api/health 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend успешно запущен!
    ) else (
        echo ❌ Backend всё ещё недоступен
        echo 💡 Проверьте консоль backend на ошибки
    )
)

echo.
echo 🔧 Проверяем API планирования...
curl -s -w "Status: %%{http_code}\n" http://localhost:5100/api/planning-improved/analysis 2>nul

echo.
echo 📋 Проверяем API заказов...
curl -s -w "Status: %%{http_code}\n" http://localhost:5100/api/orders 2>nul

echo.
echo ===========================================
echo 🏁 Диагностика завершена
echo ===========================================
pause
