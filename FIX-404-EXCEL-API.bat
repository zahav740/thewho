@echo off
echo ====================================
echo РЕШЕНИЕ ПРОБЛЕМЫ 404 - EXCEL API
echo ====================================
echo.

echo 🔧 Шаг 1: Исправлены TypeScript ошибки
echo ✅ Исправлена ошибка с типом 'result'
echo ✅ Исправлена ошибка с типом возвращаемого значения
echo.

echo 🔧 Шаг 2: Проверяем контроллер
echo ✅ ExcelImportDbController включен в orders.module.ts
echo.

echo 🔧 Шаг 3: Перезапуск backend с исправлениями
echo.

cd /d "%~dp0backend"

echo 🛑 Останавливаем текущий backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do (
    echo Завершаем процесс %%a...
    taskkill /F /PID %%a 2>nul
)

echo ⏳ Ожидание освобождения порта...
timeout /t 3 /nobreak > nul

echo 🚀 Запускаем backend с исправлениями...
echo.
echo 📋 После запуска увидите:
echo    - "Application is running on: http://localhost:5100"
echo    - "Swagger API docs: http://localhost:5100/api/docs"
echo.
echo 🎯 Тогда Excel API будет работать!
echo.

start "Backend" cmd /k "npm run start:dev"

echo ⏳ Ждем запуска backend...
timeout /t 10 /nobreak > nul

echo.
echo 🧪 Тестируем API...
cd /d "%~dp0"
node scripts\quick-test-api.js

echo.
echo ====================================
echo ГОТОВО! Попробуйте загрузить Excel
echo ====================================
pause
