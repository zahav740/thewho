@echo off
echo ===================================
echo    ТЕСТИРОВАНИЕ EXCEL IMPORT MODULE
echo ===================================
echo.

cd /d "%~dp0"
cd backend

echo Шаг 1: Компиляция TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции!
    pause
    exit /b 1
)

echo.
echo Шаг 2: Запуск сервера...
start "Backend Server" cmd /c "npm run start:dev"

echo.
echo Ожидание запуска сервера...
timeout /t 10 /nobreak >nul

echo.
echo Шаг 3: Тестирование Excel Import API...
curl -X GET "http://localhost:5100/api/excel-import/stats" -H "accept: application/json"

echo.
echo Шаг 4: Получение списка файлов...
curl -X GET "http://localhost:5100/api/excel-import/files" -H "accept: application/json"

echo.
echo ===================================
echo    ТЕСТ ЗАВЕРШЕН
echo ===================================
echo.
echo Проверьте результаты выше.
echo Для загрузки файла используйте Postman или фронтенд.
echo.
pause
