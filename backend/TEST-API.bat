@echo off
echo =====================================================
echo  ТЕСТИРОВАНИЕ API АУТЕНТИФИКАЦИИ
echo =====================================================
echo.

echo Проверка 1: Health check...
curl -s http://localhost:5100/api/health
echo.
echo.

echo Проверка 2: Login endpoint...
curl -X POST http://localhost:5100/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"kasuf\",\"password\":\"kasuf123\"}"
echo.
echo.

echo Проверка 3: Swagger docs...
echo Открываем: http://localhost:5100/api/docs
start http://localhost:5100/api/docs

echo.
pause
