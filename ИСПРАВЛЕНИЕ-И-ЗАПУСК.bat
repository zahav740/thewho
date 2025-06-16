@echo off
echo ===========================================
echo ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК И ЗАПУСК
echo ===========================================
echo.

echo 🔧 Проверяем TypeScript ошибки...
cd frontend

echo.
echo 📝 Компилируем проект...
call npm run build > typescript_check.log 2>&1

if %ERRORLEVEL% == 0 (
    echo ✅ TypeScript ошибки исправлены!
    echo.
    echo 🚀 Запускаем frontend...
    start "Frontend Server" cmd /c "npm start"
    
    echo.
    echo Запускаем backend...
    cd ..\backend
    start "Backend Server" cmd /c "npm run start:dev"
    
    echo.
    echo 🎉 Все серверы запущены успешно!
    echo 📱 Откройте: http://localhost:3000/shifts
) else (
    echo ❌ Найдены ошибки TypeScript:
    type typescript_check.log
    echo.
    echo 🔧 Исправьте ошибки и запустите скрипт заново
)

echo.
pause
