@echo off
echo ======================================
echo ТЕСТИРОВАНИЕ EXCEL API (ПРОСТАЯ ВЕРСИЯ)
echo ======================================

echo [1] Компиляция backend с тестовым контроллером...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции backend!
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!

echo.
echo [2] Проверяем работу API endpoints...
timeout /t 3 /nobreak > nul

echo Тестируем базовый health endpoint:
curl -s -w "HTTP %%{http_code}\n" http://localhost:5100/api/health

echo.
echo Тестируем тестовый Excel endpoint:
curl -s -w "\nHTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/test

echo.
echo Тестируем фильтры:
curl -s -w "\nHTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/filters

echo.
echo Тестируем список импортов:
curl -s -w "\nHTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/imports

echo.
echo ======================================
echo РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ
echo ======================================
echo Если все endpoints возвращают HTTP 200,
echo значит тестовый контроллер работает!
echo ======================================

pause
