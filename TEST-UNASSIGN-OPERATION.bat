@echo off
echo ===========================================
echo 🔧 ТЕСТ API ОТМЕНЫ ОПЕРАЦИИ
echo ===========================================

echo.
echo 📡 Проверяем backend на порту 5100...
curl -s http://localhost:5100/api/health
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend НЕ запущен!
    echo 🚀 Сначала запустите backend: cd backend && npm run start:dev
    pause
    exit /b 1
)

echo ✅ Backend запущен!
echo.

echo 📋 Получаем список станков...
curl -s http://localhost:5100/api/machines

echo.
echo.
echo 🗑️ Тестируем отмену операции со станка "Doosan 3"...
echo.

curl -X DELETE ^
  -H "Content-Type: application/json" ^
  -w "HTTP Status: %%{http_code}\nTime: %%{time_total}s\n" ^
  http://localhost:5100/api/machines/Doosan%%203/assign-operation

echo.
echo.
echo 📋 Проверяем обновленный статус станков...
curl -s http://localhost:5100/api/machines

echo.
echo ===========================================
echo 🏁 Тест завершен
echo ===========================================
pause
