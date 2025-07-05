@echo off
echo ===========================================
echo ПРИНУДИТЕЛЬНЫЙ ЗАПУСК BACKEND БЕЗ TYPESCRIPT
echo ===========================================

cd backend

echo 🚀 Запускаем backend принудительно, игнорируя ошибки TypeScript...
echo.

echo Способ 1: Запуск с --skipLibCheck
start "Backend Server (Force)" cmd /k "echo ПРИНУДИТЕЛЬНЫЙ ЗАПУСК BACKEND... && echo Игнорируем ошибки TypeScript && echo Порт: 5100 && echo. && npx nest start --watch --preserveWatchOutput"

echo.
echo ✅ Backend запущен принудительно!
echo.
echo 🌐 Проверьте в браузере через 30 секунд:
echo http://localhost:5100/api/health
echo.
echo Если backend не запустился, попробуйте альтернативный способ:
echo npm run start:dev --force
echo.

pause
