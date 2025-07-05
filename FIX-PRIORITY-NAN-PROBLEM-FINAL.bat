@echo off
echo ==============================================
echo   ИСПРАВЛЕНИЕ ПРОБЛЕМЫ priority: NaN
echo ==============================================

cd /d "%~dp0"

echo.
echo 🎯 ПРОБЛЕМА НАЙДЕНА И ИСПРАВЛЕНА:
echo.
echo ❌ В operation-formatter.ts функция formatOrderData
echo    конвертировала строки в числа: Number('LOW') = NaN
echo.
echo ✅ ИСПРАВЛЕНИЕ:
echo    - Убрана конвертация priority в числа
echo    - Приоритеты остаются строками для V2 API
echo    - Обновлены комментарии в ordersApi.ts
echo.

echo ⏳ Проверяем TypeScript компиляцию frontend...
cd frontend
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Все еще есть ошибки TypeScript
    echo.
    pause
    exit /b 1
)

echo ✅ TypeScript компиляция - OK!
echo.

echo ⏳ Перезапускаем frontend для применения исправлений...
taskkill /f /im node.exe 2>nul

echo.
echo 🚀 Запускаем frontend на порту 5101...
start "CRM Frontend FIXED" npm run dev

echo.
echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!
echo.
echo 🧪 ТЕПЕРЬ МОЖНО ТЕСТИРОВАТЬ:
echo    1. Excel импорт должен работать без ошибки 400
echo    2. Приоритеты сохраняются как строки: 'HIGH', 'MEDIUM', 'LOW'
echo    3. Больше никаких priority: NaN в логах
echo.
echo 🌐 Frontend: http://localhost:5101
echo 📊 Backend API: http://localhost:5100/api
echo.
echo 🔍 В логах браузера теперь должно быть:
echo    📝 API V2: Отформатированные данные: {priority: 'LOW', ...}
echo    🔄 Отформатированные данные: {priority: 'LOW', ...}
echo.
pause
