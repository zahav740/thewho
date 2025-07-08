@echo off
echo ==============================================
echo    ФИНАЛЬНАЯ ПРОВЕРКА ВСЕХ ИСПРАВЛЕНИЙ
echo ==============================================
echo.

echo 🔧 Проверяем Backend...
cd /d "%~dp0backend"
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend: TypeScript компиляция БЕЗ ОШИБОК!
) else (
    echo ❌ Backend: Остались ошибки TypeScript
    pause
    exit /b 1
)

echo.
echo 🎨 Проверяем Frontend...
cd /d "%~dp0frontend"
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend: TypeScript компиляция БЕЗ ОШИБОК!
) else (
    echo ❌ Frontend: Остались ошибки TypeScript
    pause
    exit /b 1
)

echo.
echo 🎉 ВСЕ ИСПРАВЛЕНО! Можно запускать:
echo 1. Backend: cd backend ^&^& npm run migration:run ^&^& npm run start:dev
echo 2. Frontend: cd frontend ^&^& npm start
echo 3. Открыть: http://localhost:5101/excel-import
echo ==============================================
pause
