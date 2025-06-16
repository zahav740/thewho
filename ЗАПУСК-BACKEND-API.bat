@echo off
echo ================================================
echo  🔧 ЗАПУСК BACKEND С НОВЫМИ API ENDPOINTS
echo ================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 📋 Новые API endpoints для завершения операций:
echo.
echo 🔍 Проверка завершенных операций:
echo   GET /api/operations/completed-check
echo.
echo 📊 Детали завершенной операции:  
echo   GET /api/operations/:id/completion-details
echo.
echo ✅ Закрыть операцию:
echo   POST /api/operations/:id/close
echo.
echo ▶️ Продолжить операцию:
echo   POST /api/operations/:id/continue
echo.
echo 🗃️ Архивировать и освободить станок:
echo   POST /api/operations/:id/archive-and-free
echo.
echo 📈 Обновить прогресс:
echo   PUT /api/operations/operation/:id
echo.

echo 🚀 Запуск Backend сервера...
echo 🌐 API будет доступно по адресу: http://localhost:5100
echo 📚 Swagger документация: http://localhost:5100/api-docs
echo.

if exist node_modules (
    echo ✅ node_modules найден
) else (
    echo ❌ node_modules не найден, запускаем npm install...
    npm install
)

echo 🔄 Компиляция TypeScript...
npm run build

echo 🎯 Запуск в production режиме...
npm run start:prod

pause
