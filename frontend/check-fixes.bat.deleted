@echo off
echo 🔍 Проверяем исправление ошибок TypeScript...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📋 Запускаем проверку TypeScript...
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript проверка пройдена успешно!
    echo 🔨 Запускаем сборку...
    call npm run build
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Сборка завершена успешно!
        echo 🎉 Все ошибки исправлены!
    ) else (
        echo ❌ Ошибка сборки
    )
) else (
    echo ❌ Остались ошибки TypeScript
)

pause
