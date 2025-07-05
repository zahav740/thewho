@echo off
echo ======================================
echo БЫСТРОЕ ИСПРАВЛЕНИЕ EXCEL ИМПОРТА
echo ======================================

set ROOT_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm

echo [1/6] Остановка существующих процессов...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2/6] Создание таблиц в PostgreSQL...
echo Подключение к базе данных...
psql -h localhost -p 5432 -U postgres -d thewho -f "%ROOT_DIR%\CREATE-EXCEL-IMPORT-TABLES.sql"

echo [3/6] Компиляция Backend...
cd /d "%ROOT_DIR%\backend"
call npm run build

echo [4/6] Запуск Backend с Excel поддержкой...
cd /d "%ROOT_DIR%\backend"
start "Backend :5100 Excel Ready" cmd /c "echo Backend с Excel API запускается... && npm run start:dev"

echo Ожидание запуска Backend (15 секунд)...
timeout /t 15 /nobreak > nul

echo [5/6] Тестирование Excel API endpoints...
echo Тестируем Health...
curl -s -o nul -w "Health: HTTP %%{http_code}\n" http://localhost:5100/api/health

echo Тестируем Excel Filters...
curl -s -o nul -w "Excel Filters: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/filters

echo Тестируем Excel Imports...
curl -s -o nul -w "Excel Imports: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/imports

echo [6/6] Запуск Frontend...
cd /d "%ROOT_DIR%\frontend"
start "Frontend :5101 Excel Ready" cmd /c "echo Frontend с Excel UI запускается... && npm start"

echo.
echo ======================================
echo ✅ EXCEL ИМПОРТ СИСТЕМА ГОТОВА!
echo ======================================
echo 🔧 Backend API:     http://localhost:5100/api
echo 📚 Excel Endpoints: http://localhost:5100/api/excel-import-db/*
echo 🌐 Frontend:        http://localhost:5101
echo 📊 Excel Manager:   http://localhost:5101 → База данных → Excel БД Менеджер
echo ======================================
echo.
echo 📋 Протестируйте Excel импорт:
echo 1. Откройте http://localhost:5101
echo 2. База данных → "🗄️ Excel БД Менеджер"
echo 3. Выберите целевую таблицу
echo 4. Загрузите Excel файл
echo 5. Файл сохранится в БД и появится в списке
echo ======================================

pause
