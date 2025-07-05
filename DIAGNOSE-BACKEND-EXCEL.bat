@echo off
echo ======================================
echo ДИАГНОСТИКА BACKEND EXCEL API
echo ======================================

set BACKEND_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm\backend

cd /d "%BACKEND_DIR%"

echo [1] Проверка файлов контроллера...
if exist "src\modules\orders\excel-import-db.controller.ts" (
    echo ✅ ExcelImportDbController найден
) else (
    echo ❌ ExcelImportDbController отсутствует
)

if exist "src\modules\orders\excel-import-db.service.ts" (
    echo ✅ ExcelImportDbService найден
) else (
    echo ❌ ExcelImportDbService отсутствует
)

echo.
echo [2] Проверка entity файлов...
if exist "src\database\entities\excel\excel-import.entity.ts" (
    echo ✅ ExcelImport entity найден
) else (
    echo ❌ ExcelImport entity отсутствует
)

if exist "src\database\entities\excel\import-filter.entity.ts" (
    echo ✅ ImportFilter entity найден
) else (
    echo ❌ ImportFilter entity отсутствует
)

echo.
echo [3] Компиляция TypeScript...
call npm run build

echo.
echo [4] Проверка доступности API endpoints...
echo Тестируем: http://localhost:5100/api/health
curl -s -o nul -w "Health endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/health

echo Тестируем: http://localhost:5100/api/excel-import-db/filters
curl -s -o nul -w "Excel filters endpoint: HTTP %%{http_code}\n" http://localhost:5100/api/excel-import-db/filters

echo.
echo [5] Запуск backend с детальными логами...
echo Запускаем backend и следим за логами...
call npm run start:dev

pause
