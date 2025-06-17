@echo off
echo ===============================================
echo ИСПРАВЛЕНИЯ TYPESCRIPT ОШИБОК DRAWINGNUMBER
echo ===============================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo Ошибки TypeScript в файлах DataDiagnostics.tsx и SimpleProductionView.tsx
echo были исправлены. Использование свойства 'drawingnumber' заменено на 'drawingNumber'.
echo.

echo ИЗМЕНЕНИЯ:
echo - DataDiagnostics.tsx: исправлены 2 места с 'shift.drawingnumber'
echo - SimpleProductionView.tsx: исправлены 2 места с 'shift.drawingnumber'
echo.

echo Проверяем компиляцию...
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ОШИБКИ ИСПРАВЛЕНЫ! TypeScript компилируется без ошибок.
    echo.
    echo Запускаем приложение...
    echo.
    npm start
) else (
    echo.
    echo ❌ ОСТАЛИСЬ ОШИБКИ! Проверьте вывод выше.
    echo.
)

pause
