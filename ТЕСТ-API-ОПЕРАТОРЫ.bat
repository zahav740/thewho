@echo off
chcp 65001
echo.
echo ===============================================
echo 🧪 ТЕСТ API ОПЕРАТОРОВ
echo ===============================================
echo.

echo 1. Тестируем GET /api/operators
curl -X GET "http://localhost:3001/api/operators" -H "Content-Type: application/json" 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ GET /api/operators работает
) else (
  echo ❌ GET /api/operators не работает
)

echo.
echo.
echo 2. Тестируем GET /api/operators/setup
curl -X GET "http://localhost:3001/api/operators/setup" -H "Content-Type: application/json" 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ GET /api/operators/setup работает
) else (
  echo ❌ GET /api/operators/setup не работает
)

echo.
echo.
echo 3. Тестируем GET /api/operators/production
curl -X GET "http://localhost:3001/api/operators/production" -H "Content-Type: application/json" 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ GET /api/operators/production работает
) else (
  echo ❌ GET /api/operators/production не работает
)

echo.
echo.
echo 4. Тестируем POST /api/operators (создание тестового оператора)
curl -X POST "http://localhost:3001/api/operators" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"TestOperator\",\"operatorType\":\"BOTH\"}" 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ POST /api/operators работает
) else (
  echo ❌ POST /api/operators не работает
)

echo.
echo.
echo 📋 Результат тестирования API операторов завершен.
echo.
echo Если все тесты прошли успешно (✅), то проблема была в:
echo  - Отсутствии таблицы operators
echo  - Или неправильной регистрации модуля
echo.
echo Если тесты не прошли (❌), проверьте:
echo  - Backend запущен на порту 3001
echo  - Модуль OperatorsModule зарегистрирован в app.module.ts
echo  - Таблица operators существует в базе данных
echo.

pause
