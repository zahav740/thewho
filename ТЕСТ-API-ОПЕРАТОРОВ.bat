@echo off
chcp 65001
echo.
echo ===============================================
echo 🧪 ТЕСТ API ОПЕРАТОРОВ
echo ===============================================
echo.

echo 📋 Тестируем endpoints операторов:
echo.

echo 1. Тест базового endpoint...
curl -s http://localhost:5100/api/operators
echo.
echo.

echo 2. Тест операторов наладки...
curl -s "http://localhost:5100/api/operators?type=SETUP&active=true"
echo.
echo.

echo 3. Тест операторов производства...
curl -s "http://localhost:5100/api/operators?type=PRODUCTION&active=true"
echo.
echo.

echo 4. Проверка health...
curl -s http://localhost:5100/api/health
echo.
echo.

echo ===============================================
echo Если видите JSON с операторами - API работает!
echo Если ошибки - проверьте что Backend запущен
echo ===============================================

pause
