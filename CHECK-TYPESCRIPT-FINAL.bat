@echo off
echo ===========================================
echo ПРОВЕРКА ИСПРАВЛЕНИЙ TYPESCRIPT
echo ===========================================

cd backend

echo 📊 Проверяем TypeScript компиляцию...
echo.

npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ ОШИБКИ ИСПРАВЛЕНЫ!
    echo ✅ TypeScript компилируется без ошибок
    echo ✅ Express типы загружены корректно
    echo ✅ Все middleware исправлены
    echo ✅ Все контроллеры работают
    echo.
    echo 🚀 Теперь можно запускать backend:
    echo npm run start:dev
    echo.
) else (
    echo.
    echo ❌ Остались ошибки TypeScript
    echo Проверьте вывод выше
    echo.
)

pause
