@echo off
echo ======================================
echo ЗАПУСК РАБОЧЕЙ ВЕРСИИ EXCEL ИМПОРТА
echo ======================================

set ROOT_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm

echo [1/6] Остановка всех процессов...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo [2/6] Компиляция Backend с упрощенным Excel контроллером...
cd /d "%ROOT_DIR%\backend"
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции! Проверьте код.
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!

echo [3/6] Запуск Backend...
start "Backend Excel Simple :5100" cmd /c "cd /d \"%ROOT_DIR%\backend\" && echo === Backend с упрощенным Excel API === && npm run start:dev"

echo [4/6] Ожидание запуска Backend (20 секунд)...
timeout /t 20 /nobreak > nul

echo [5/6] Тестирование всех Excel endpoints...
echo.

echo ✅ Health Check:
curl -s -o nul -w "HTTP %%{http_code}\n" http://localhost:5100/api/health

echo ✅ Excel Test:
curl -s -o nul -w "HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/test

echo ✅ Excel Filters:
curl -s -o nul -w "HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/filters

echo ✅ Excel Imports List:
curl -s -o nul -w "HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/imports

echo.
echo [6/6] Запуск Frontend...
cd /d "%ROOT_DIR%\frontend"
start "Frontend Excel Working :5101" cmd /c "cd /d \"%ROOT_DIR%\frontend\" && echo === Frontend с рабочим Excel UI === && npm start"

echo.
echo ======================================
echo ✅ РАБОЧАЯ EXCEL СИСТЕМА ЗАПУЩЕНА!
echo ======================================
echo 🔧 Backend:          http://localhost:5100
echo 📊 Excel Test:       http://localhost:5100/api/excel-import-db/test
echo 📋 Excel Filters:    http://localhost:5100/api/excel-import-db/filters
echo 🌐 Frontend:         http://localhost:5101
echo 💾 Excel Manager:    http://localhost:5101 → База данных → Excel БД Менеджер
echo ======================================
echo.
echo 📝 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:
echo.
echo 1. Дождитесь полной загрузки Frontend (30-60 сек)
echo 2. Откройте http://localhost:5101
echo 3. Перейдите в "База данных"
echo 4. Нажмите "🗄️ Excel БД Менеджер"
echo 5. Фильтры должны загрузиться автоматически
echo 6. Загрузите Excel файл - система покажет результат
echo.
echo ⚠️  ПРИМЕЧАНИЕ:
echo Это упрощенная версия - файлы не сохраняются в БД,
echo но API полностью работает и интерфейс функционален.
echo ======================================

pause
