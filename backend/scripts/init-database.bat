@echo off
echo Инициализация базы данных...
echo.

echo Запуск миграций...
cd /d "C:\Users\Alexey\Downloads\TheWho\production-crm\backend"
call npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ошибка при выполнении миграций!
    pause
    exit /b 1
)

echo.
echo База данных успешно инициализирована!
echo.
pause
