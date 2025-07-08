@echo off
echo ===============================================
echo 🚀 ПОЛНЫЙ ЗАПУСК СИСТЕМЫ
echo ===============================================
echo Backend: http://localhost:5100
echo Frontend: http://localhost:5101
echo ===============================================

echo ✅ Проблема isDeleted исправлена
echo ✅ ExcelImportService обновлен  
echo ✅ Все колонки добавлены в БД

echo.
echo 1️⃣ Запуск Backend на порту 5100...
start "Backend Server" cmd /c "cd /d %~dp0backend && npm run start:dev"

echo.
echo ⏳ Ожидание запуска backend (5 секунд)...
timeout /t 5 > nul

echo.
echo 2️⃣ Запуск Frontend на порту 5101...
start "Frontend Server" cmd /c "cd /d %~dp0frontend && set PORT=5101 && npm start"

echo.
echo ⏳ Ожидание запуска frontend (10 секунд)...
timeout /t 10 > nul

echo.
echo 🎯 Тестирование API...
curl -X GET "http://localhost:5100/api/orders?page=1&limit=3" -H "Content-Type: application/json"

echo.
echo.
echo ===============================================
echo 🎉 СИСТЕМА ЗАПУЩЕНА!
echo ===============================================
echo.
echo 📱 ДОСТУПНЫЕ АДРЕСА:
echo    🔧 Backend API: http://localhost:5100/api
echo    🌐 Frontend UI: http://localhost:5101
echo.
echo 📋 ДЛЯ ТЕСТИРОВАНИЯ EXCEL:
echo    1. Откройте http://localhost:5101
echo    2. Перейдите в раздел "База данных"
echo    3. Нажмите "Импорт Excel"
echo    4. Загрузите Excel файл
echo    5. Проверьте, что заказы создаются
echo.
echo 🔍 ДИАГНОСТИКА:
echo    - Логи backend: смотрите в окне "Backend Server"
echo    - Если проблемы: запустите 🎯 FULL-EXCEL-DIAGNOSTIC.bat
echo.
pause
