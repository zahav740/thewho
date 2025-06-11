@echo off
echo ================================================
echo 🔍 ПРОВЕРКА СТАТУСА BACKEND СЕРВЕРА
echo ================================================

echo.
echo 📡 Проверяем порт 5100...
curl -s http://localhost:5100/api/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend работает на порту 5100
) else (
    echo ❌ Backend НЕ отвечает на порту 5100
)

echo.
echo 📡 Проверяем порт 3001...
curl -s http://localhost:3001/api/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend работает на порту 3001
) else (
    echo ❌ Backend НЕ отвечает на порту 3001
)

echo.
echo 🔗 Проверяем конкретный endpoint operation-analytics...
curl -s http://localhost:5100/api/operation-analytics/machine/1 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Operation-analytics endpoint доступен на 5100
) else (
    echo ❌ Operation-analytics endpoint НЕ доступен на 5100
    echo.
    echo Попробуем порт 3001...
    curl -s http://localhost:3001/api/operation-analytics/machine/1 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Operation-analytics endpoint доступен на 3001
        echo.
        echo ⚠️ ВНИМАНИЕ: Backend работает на порту 3001, а не 5100!
        echo Нужно изменить URL в frontend на http://localhost:3001
    ) else (
        echo ❌ Operation-analytics endpoint НЕ найден
    )
)

echo.
echo 🌐 Проверяем доступные маршруты...
echo Trying to get Swagger docs...
curl -s http://localhost:5100/api/docs 2>nul | findstr "operation-analytics" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Operation-analytics маршруты найдены в Swagger
) else (
    echo ❌ Operation-analytics маршруты НЕ найдены в Swagger
)

echo.
echo === РЕЗУЛЬТАТ ===
echo.
echo Если backend работает НЕ на порту 5100, запустите его правильно:
echo cd backend
echo set PORT=5100
echo npm run start
echo.
pause
