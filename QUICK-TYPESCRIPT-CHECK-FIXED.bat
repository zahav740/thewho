@echo off
echo ===========================================
echo БЫСТРАЯ ПРОВЕРКА ИСПРАВЛЕНИЙ TYPESCRIPT
echo ===========================================

cd backend

echo.
echo 📊 Проверяем TypeScript компиляцию...
echo.

npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ ИСПРАВЛЕНИЯ TYPESCRIPT УСПЕШНО ПРИМЕНЕНЫ!
    echo.
    echo Теперь можно запускать:
    echo - npm run start:dev ^(разработка^)
    echo - npm run build ^(сборка^)
    echo.
) else (
    echo.
    echo ❌ Остались ошибки TypeScript
    echo Проверьте вывод выше
    echo.
)

pause
