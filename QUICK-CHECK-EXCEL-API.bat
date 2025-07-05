@echo off
echo ====================================
echo БЫСТРАЯ ПРОВЕРКА EXCEL API
echo ====================================
echo.

echo 🔍 Проверяем подключение к Backend...
curl -s http://localhost:5100/api/health > nul
if errorlevel 1 (
    echo ❌ Backend недоступен на порту 5100
    echo 💡 Запустите backend командой: cd backend ^&^& npm run start:dev
    pause
    exit /b 1
)

echo ✅ Backend доступен!
echo.

echo 🔍 Проверяем Excel Import API...
curl -s http://localhost:5100/api/excel-import-db/filters > nul
if errorlevel 1 (
    echo ❌ Excel Import API недоступен
    echo 💡 Возможно, контроллер не подключен или нужно перезапустить backend
) else (
    echo ✅ Excel Import API работает!
    echo.
    echo 📊 Доступные фильтры:
    curl -s http://localhost:5100/api/excel-import-db/filters
)

echo.
echo ====================================
echo Проверка завершена
echo ====================================
pause
