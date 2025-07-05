@echo off
echo ====================================
echo ФИНАЛЬНЫЙ ЗАПУСК EXCEL IMPORT CRM
echo ====================================
echo.

echo 🔍 Шаг 1: Проверка портов...
netstat -an | findstr ":5100 " > nul
if not errorlevel 1 (
    echo ⚠️ Порт 5100 занят, освобождаем...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul
    timeout /t 2 /nobreak > nul
)

echo 🔍 Шаг 2: Проверка базы данных...
cd /d "%~dp0backend"
node test-db-connection.js
if errorlevel 1 (
    echo ❌ Проблемы с базой данных
    pause
    exit /b 1
)

echo.
echo 🔍 Шаг 3: Настройка environment...
copy /y .env.development .env > nul
echo ✅ Настройки разработки применены

echo.
echo 🚀 Шаг 4: Запуск backend...
echo 📋 Backend будет доступен на: http://localhost:5100
echo 📋 API документация: http://localhost:5100/api/docs
echo 📋 Excel Import API: http://localhost:5100/api/excel-import-db
echo 📋 Frontend (уже запущен): http://localhost:5101
echo.
echo ⏳ Запускаем backend...

start "Backend Server" cmd /c "npm run start:dev & pause"

echo ⏳ Ожидаем запуска backend...
timeout /t 10 /nobreak > nul

echo.
echo 🧪 Шаг 5: Тестирование API...
cd /d "%~dp0"
node scripts\check-excel-system.js

echo.
echo ====================================
echo ✅ СИСТЕМА ЗАПУЩЕНА И ГОТОВА!
echo ====================================
echo.
echo 🎮 ЧТО ДЕЛАТЬ ДАЛЬШЕ:
echo 1. Откройте http://localhost:5101
echo 2. Войдите в систему (kasuf / admin)
echo 3. Перейдите в раздел "База данных"
echo 4. Нажмите "🗄️ Excel БД Менеджер"
echo 5. Загрузите Excel файл для тестирования
echo.
echo 📊 Демонстрационные файлы:
echo - test-orders-excel-import.xlsx (русские заголовки)
echo - test-orders-english.xlsx (английские заголовки)
echo.
echo 🔧 Если что-то не работает:
echo - Проверьте логи backend в новом окне
echo - Откройте F12 в браузере и смотрите Network tab
echo - Убедитесь, что PostgreSQL запущен
echo.
pause
