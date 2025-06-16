@echo off
echo 🔧 ЗАПУСК BACKEND В DEV РЕЖИМЕ (ИСПРАВЛЕННЫЙ)
echo.
echo ✅ Все ошибки TypeScript исправлены
echo ✅ EventEmitter отключен для совместимости
echo ✅ Система мониторинга производства работает
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Проверяем зависимости...
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    call npm install
)

echo.
echo 🚀 Запускаем в development режиме с автоперезагрузкой...
echo.
echo 📊 Backend будет доступен на:
echo    http://localhost:3001/api/machines
echo    http://localhost:3001/api/shifts
echo    http://localhost:3001/api/docs
echo.

set NODE_ENV=development

call npm run start:dev

pause
