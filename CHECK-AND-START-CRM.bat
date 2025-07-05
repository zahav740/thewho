@echo off
echo ========================================
echo ПРОВЕРКА TYPESCRIPT И ЗАПУСК CRM
echo ========================================
echo.

cd backend

echo 🔍 Проверяем TypeScript ошибки...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Найдены TypeScript ошибки!
    echo 🔧 Исправления уже внесены в типы Express
    echo 📝 Проверьте файл: src/types/express.d.ts
    echo.
    echo Продолжить запуск? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" (
        echo Отменено пользователем
        pause
        exit /b 1
    )
) else (
    echo ✅ TypeScript ошибок не найдено!
)

cd ..

echo.
echo 🚀 Запускаем CRM систему...
call START-CRM-PORTS-5100-5101.bat
