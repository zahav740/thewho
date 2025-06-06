@echo off
echo ====================================
echo ПРОВЕРКА BACKEND СЕРВЕРА
echo ====================================
echo.

echo Проверяем подключение к серверу на порту 5101...
echo.

echo 1. Health check:
curl -s -w "\nHTTP код: %%{http_code}\n" http://localhost:5101/api/health || echo "❌ Сервер недоступен"

echo.
echo 2. API Documentation:
echo Откройте в браузере: http://localhost:5101/api/docs

echo.
echo 3. Простой тест:
curl -s -w "\nHTTP код: %%{http_code}\n" http://localhost:5101/api/calendar/test || echo "❌ Тест не прошел"

echo.
echo ====================================
echo РЕЗУЛЬТАТ ПРОВЕРКИ
echo ====================================
echo.
echo Если HTTP код = 200 - сервер работает ✅
echo Если "Сервер недоступен" - запустите backend ❌
echo.
pause
