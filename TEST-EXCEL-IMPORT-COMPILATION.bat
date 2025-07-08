@echo off
echo ===========================================
echo   ТЕСТИРОВАНИЕ КОМПИЛЯЦИИ FRONTEND
echo ===========================================
echo.

cd /d "%~dp0frontend"

echo Проверяем зависимости...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
)

echo.
echo Запуск проверки TypeScript...
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ УСПЕХ: TypeScript компиляция прошла без ошибок!
    echo.
    echo Запуск сборки проекта...
    npm run build
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ УСПЕХ: Проект собран без ошибок!
        echo ✅ Excel Import модуль готов к использованию!
    ) else (
        echo.
        echo ❌ ОШИБКА: Не удалось собрать проект
    )
) else (
    echo.
    echo ❌ ОШИБКА: TypeScript компиляция завершилась с ошибками
)

echo.
echo ===========================================
echo   РЕЗУЛЬТАТ ПРОВЕРКИ
echo ===========================================
pause
