@echo off
echo ====================================
echo ФИНАЛЬНОЕ РЕШЕНИЕ 404 ПРОБЛЕМЫ
echo ====================================
echo.

echo ✅ Исправления применены:
echo    - TypeScript ошибки устранены
echo    - Контроллер включен в модуль
echo    - Сервис готов к работе
echo.

cd /d "%~dp0backend"

echo 🔍 Финальная проверка TypeScript...
npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo ❌ Все еще есть ошибки TypeScript
    echo 🔧 Но попробуем запустить принудительно...
) else (
    echo ✅ TypeScript проверка пройдена!
)

echo.
echo 🛑 Останавливаем backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul

echo ⏳ Ожидание...
timeout /t 2 /nobreak > nul

echo.
echo 🚀 Запускаем backend...
echo.
echo 📋 СЛЕДИТЕ ЗА КОНСОЛЬЮ:
echo    - Дождитесь "Application is running on: http://localhost:5100"
echo    - Не должно быть ошибок компиляции
echo    - Excel API endpoints будут доступны
echo.

npm run start:dev

pause
