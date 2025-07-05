@echo off
chcp 65001
echo ========================================
echo БЫСТРАЯ ПРОВЕРКА TYPESCRIPT ОШИБОК
echo ========================================

cd backend

echo 🔍 Проверяем типы TypeScript...
echo.

npx tsc --noEmit --skipLibCheck

if %errorlevel% == 0 (
    echo.
    echo ✅ ВСЕ ОШИБКИ TYPESCRIPT ИСПРАВЛЕНЫ!
    echo.
    echo ✅ Готово к запуску!
) else (
    echo.
    echo ❌ Есть ошибки TypeScript
    echo.
    echo Попробуйте исправить оставшиеся ошибки
)

echo.
echo Нажмите любую клавишу для продолжения...
pause >nul
