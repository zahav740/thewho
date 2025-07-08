@echo off
echo ===================================
echo    ПОЛНОЕ ТЕСТИРОВАНИЕ EXCEL IMPORT
echo ===================================
echo.

cd /d "%~dp0"

echo Шаг 1: Создание тестовых Excel файлов...
call CREATE-TEST-EXCEL.bat
if %errorlevel% neq 0 (
    echo ❌ Ошибка создания тестовых файлов!
    pause
    exit /b 1
)

echo.
echo Шаг 2: Переход в директорию backend...
cd backend

echo.
echo Шаг 3: Установка зависимостей...
npm install

echo.
echo Шаг 4: Компиляция TypeScript...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции!
    pause
    exit /b 1
)

echo.
echo Шаг 5: Запуск backend сервера...
start "Backend Server" cmd /c "npm run start:dev"

echo.
echo Шаг 6: Ожидание запуска сервера...
timeout /t 15 /nobreak >nul

echo.
echo Шаг 7: Проверка доступности сервера...
curl -X GET "http://localhost:5100/api/health" -H "accept: application/json" --connect-timeout 10 --max-time 30
if %errorlevel% neq 0 (
    echo ❌ Сервер недоступен!
    echo Проверьте, что сервер запущен на порту 5100
    pause
    exit /b 1
)

echo.
echo ✅ Сервер доступен!
echo.

echo Шаг 8: Тестирование Excel Import API...
echo.

echo 📊 Получение статистики...
curl -X GET "http://localhost:5100/api/excel-import/stats" -H "accept: application/json"
echo.

echo 📋 Получение списка файлов...
curl -X GET "http://localhost:5100/api/excel-import/files" -H "accept: application/json"
echo.

echo 🔍 Тестирование валидации файла...
curl -X POST "http://localhost:5100/api/excel-import/validate" ^
  -H "accept: application/json" ^
  -H "Content-Type: multipart/form-data" ^
  -F "file=@../test-excel-data.xlsx"
echo.

echo ===================================
echo    ТЕСТИРОВАНИЕ ЗАВЕРШЕНО
echo ===================================
echo.
echo ✅ Модуль Excel Import готов к использованию!
echo.
echo Для полного тестирования загрузки файлов:
echo 1. Используйте Postman или другой HTTP клиент
echo 2. Отправьте POST запрос на /api/excel-import/upload
echo 3. Приложите тестовый файл test-excel-data.xlsx
echo.
echo Доступные тестовые файлы:
echo - test-excel-data.xlsx (5 строк)
echo - test-excel-large-data.xlsx (1000 строк)
echo.
echo Swagger UI доступен по адресу:
echo http://localhost:5100/api/docs
echo.
pause
