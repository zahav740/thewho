@echo off
echo ===========================================
echo      ЗАПУСК ИСПРАВЛЕННОГО BACKEND
echo ===========================================
echo.

echo Проверяем TypeScript ошибки...
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Компилируем проект...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ОШИБКА КОМПИЛЯЦИИ! Проверьте ошибки выше.
    pause
    exit /b 1
)

echo.
echo ✅ Компиляция успешна!
echo.

echo Запускаем сервер...
echo.
call npm run start

pause
