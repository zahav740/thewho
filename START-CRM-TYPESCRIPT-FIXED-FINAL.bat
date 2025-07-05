@echo off
echo ==============================================
echo     ЗАПУСК CRM СИСТЕМЫ С ИСПРАВЛЕНИЯМИ
echo ==============================================

cd /d "%~dp0"

echo.
echo 📋 Последовательность запуска:
echo.
echo    1. Проверка компиляции TypeScript
echo    2. Запуск backend на порту 5100
echo    3. Запуск frontend на порту 5101
echo.

echo ⏳ Шаг 1: Проверяем TypeScript компиляцию...
cd frontend
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Обнаружены ошибки TypeScript!
    echo.
    echo 📝 Необходимо исправить ошибки перед запуском
    pause
    exit /b 1
)

echo ✅ TypeScript компиляция прошла успешно!
echo.

echo ⏳ Шаг 2: Запускаем backend на порту 5100...
cd ..\backend
start "CRM Backend" npm run start:dev

echo.
echo ⏳ Шаг 3: Ждем 5 секунд для запуска backend...
timeout /t 5 /nobreak > nul

echo.
echo ⏳ Шаг 4: Запускаем frontend на порту 5101...
cd ..\frontend
start "CRM Frontend" npm run dev

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА УСПЕШНО!
echo.
echo 🌐 Доступ к приложению:
echo    - Frontend: http://localhost:5101
echo    - Backend API: http://localhost:5100/api
echo.
echo 📋 Все исправления TypeScript применены:
echo    ✓ Исправлены типы PriorityV2 (строковые enum)
echo    ✓ Исправлены статические импорты
echo    ✓ Исправлено использование enum в компонентах
echo    ✓ Убраны небезопасные приведения типов
echo.
echo 🎉 Можете начинать работать с системой!
echo.
pause
