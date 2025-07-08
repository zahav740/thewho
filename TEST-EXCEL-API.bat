@echo off
echo ============================================
echo   ТЕСТ EXCEL IMPORT API
echo ============================================
echo.

echo 🔍 Тестируем Excel Import API эндпоинты...
echo.

REM Тест 1: Базовая проверка
echo 1. Проверяем /api/excel-import/stats
curl -X GET -H "Content-Type: application/json" http://localhost:5100/api/excel-import/stats
echo.
echo.

REM Тест 2: Список файлов
echo 2. Проверяем /api/excel-import/files
curl -X GET -H "Content-Type: application/json" http://localhost:5100/api/excel-import/files?page=1&limit=10
echo.
echo.

REM Тест 3: Swagger документация
echo 3. Проверяем Swagger UI...
echo Откройте в браузере: http://localhost:5100/api/docs
echo Найдите раздел "excel-import"
echo.

REM Тест 4: Проверка таблицы
echo 4. Проверяем таблицу excel_files в PostgreSQL...
psql -U postgres -d thewho -c "SELECT COUNT(*) as files_count FROM excel_files;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Таблица excel_files доступна
) else (
    echo ❌ Проблема с таблицей excel_files
    echo Запустите: CHECK-EXCEL-TABLE.bat
)

echo.
echo ============================================
echo   ОТЛАДКА BACKEND ЛОГОВ
echo ============================================
echo.
echo Проверьте консоль backend на наличие ошибок при запросах
echo Ошибки могут быть связанны с:
echo 1. Отсутствием таблицы excel_files
echo 2. Проблемами с TypeORM entity
echo 3. Ошибками в ExcelImportService
echo.
pause
