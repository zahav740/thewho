@echo off
echo 🔧 Проверяем исправления TypeScript ошибок...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📋 Запускаем проверку TypeScript...
call npx tsc --noEmit --pretty

if %ERRORLEVEL% EQU 0 (
    echo ✅ Все ошибки TypeScript исправлены!
    echo 🔨 Запускаем сборку для финальной проверки...
    call npm run build
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Сборка прошла успешно!
        echo 🎉 Все исправления применены корректно!
    ) else (
        echo ❌ Ошибка в сборке, но TypeScript исправлен
    )
) else (
    echo ❌ Остались ошибки TypeScript
    echo 📋 Показываем детали...
)

pause
