@echo off
echo ===================================
echo    БЫСТРЫЙ ЗАПУСК BACKEND 5100
echo ===================================
echo.

cd /d "%~dp0\backend"

echo Проверяем PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PostgreSQL не найден. Убедитесь, что PostgreSQL установлен и запущен.
)

echo.
echo Запускаем backend без установки зависимостей...
echo (если есть ошибки, используйте START-BACKEND-5100.bat)
echo.

echo 🚀 Запуск на порту 5100...
npm run start:dev

pause
