@echo off
echo Проверка компиляции бэкенда...
cd backend
echo Установка зависимостей...
call npm install --silent
echo.
echo Попытка компиляции...
call npm run build
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Компиляция успешна!
    echo Запуск сервера...
    call npm run start:dev
) else (
    echo ❌ Ошибка компиляции. Проверьте вывод выше.
    pause
)
