@echo off
echo 🔧 ПРОВЕРКА API BACKEND
echo.

echo ⏳ Проверяем доступность backend...
curl -s http://localhost:5100/api/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend доступен на порту 5100
) else (
    echo ❌ Backend не доступен на порту 5100
    echo 💡 Убедитесь что backend запущен: cd backend && npm run start:dev
    pause
    exit /b 1
)

echo.
echo 🔍 Тестируем эндпоинты operation-history...

echo Тестируем: GET /api/operation-history/drawings
curl -s -w "%%{http_code}" http://localhost:5100/api/operation-history/drawings
echo.

echo.
echo 🛠️ Проверяем модуль в operations.module.ts...
findstr /i "operation-history" "backend\src\modules\operations\operations.module.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ OperationHistoryController подключен в модуле
) else (
    echo ❌ OperationHistoryController НЕ подключен в модуле
)

echo.
echo 📋 РЕЗУЛЬТАТ ДИАГНОСТИКИ:
echo - Если backend недоступен: запустите 'cd backend && npm run start:dev'
echo - Если 404 ошибка: проверьте что OperationHistoryController подключен
echo - Если другие ошибки: проверьте консоль backend
echo.

pause
