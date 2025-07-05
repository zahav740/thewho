@echo off
echo ======================================
echo ПЕРЕЗАПУСК С ТЕСТОВЫМ EXCEL КОНТРОЛЛЕРОМ
echo ======================================

set ROOT_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm

echo [1/5] Остановка всех процессов Node.js...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak > nul

echo [2/5] Компиляция Backend с тестовым контроллером...
cd /d "%ROOT_DIR%\backend"
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции! Проверьте код.
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!

echo [3/5] Запуск Backend с тестовым Excel контроллером...
start "Backend Test Excel :5100" cmd /c "cd /d \"%ROOT_DIR%\backend\" && echo === Backend с тестовым Excel контроллером === && npm run start:dev"

echo [4/5] Ожидание запуска Backend...
timeout /t 15 /nobreak > nul

echo [5/5] Тестирование Excel endpoints...
echo.

echo Тестируем Health:
curl -s -o nul -w "Health endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/health

echo Тестируем Excel Test:
curl -s -o nul -w "Excel Test endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/test

echo Тестируем Excel Filters:
curl -s -o nul -w "Excel Filters endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/filters

echo Тестируем Excel Imports:
curl -s -o nul -w "Excel Imports endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/imports

echo.
echo ======================================
echo СТАТУС СИСТЕМЫ
echo ======================================

curl -s http://localhost:5100/api/excel-import-db/test
echo.

echo ======================================
echo ✅ ТЕСТОВАЯ СИСТЕМА ЗАПУЩЕНА!
echo ======================================
echo 🔧 Backend:        http://localhost:5100
echo 📚 Excel Test:     http://localhost:5100/api/excel-import-db/test
echo 🌐 Frontend:       http://localhost:5101 (запустите отдельно)
echo ======================================
echo.
echo 📝 Протестируйте в браузере:
echo 1. Откройте http://localhost:5100/api/excel-import-db/test
echo 2. Вы должны увидеть JSON с информацией о контроллере
echo 3. Если работает - можно переходить к полной версии
echo ======================================

pause
