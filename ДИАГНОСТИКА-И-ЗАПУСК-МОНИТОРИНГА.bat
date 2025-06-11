@echo off
chcp 65001 >nul
echo.
echo ===================================================
echo 🔧 ДИАГНОСТИКА И ЗАПУСК МОНИТОРИНГА ПРОИЗВОДСТВА
echo ===================================================
echo.

REM 1. Проверяем TypeScript ошибки
echo 🔍 Шаг 1: Проверяем TypeScript ошибки во frontend...
cd frontend
call npm run type-check 2>&1 | findstr /i "error"
if %errorlevel% neq 0 (
    echo ✅ TypeScript ошибок не найдено
) else (
    echo ❌ Найдены TypeScript ошибки
)

echo.
echo 🔍 Шаг 2: Проверяем запущен ли backend...
curl -s http://localhost:5100/api/health 2>nul | findstr "ok" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend запущен на порту 5100
) else (
    echo ❌ Backend не отвечает на порту 5100
    echo 🚀 Запускаем backend...
    cd ..\backend
    start "Backend" cmd /k "npm run start:dev"
    echo ⏳ Ждем запуска backend (15 секунд)...
    timeout /t 15 /nobreak >nul
    cd ..\frontend
)

echo.
echo 🔍 Шаг 3: Тестируем API машин...
curl -s http://localhost:5100/api/machines 2>nul | findstr "machineName" >nul
if %errorlevel% equ 0 (
    echo ✅ API машин работает корректно
) else (
    echo ❌ API машин не отдает данные
    echo 📊 Проверяем базу данных...
)

echo.
echo 🔍 Шаг 4: Проверяем доступность frontend...
netstat -an | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend уже запущен на порту 3000
) else (
    echo ❌ Frontend не запущен
    echo 🚀 Запускаем frontend...
    start "Frontend" cmd /k "npm start"
    echo ⏳ Ждем запуска frontend (20 секунд)...
    timeout /t 20 /nobreak >nul
)

echo.
echo 🔍 Шаг 5: Открываем страницу мониторинга...
start "" "http://localhost:3000/#/production"

echo.
echo ✅ ДИАГНОСТИКА ЗАВЕРШЕНА
echo 📖 Инструкции:
echo    1. Если данные не отображаются - проверьте консоль браузера F12
echo    2. Если ошибки 500/404 - перезапустите backend
echo    3. Если карточки станков пустые - проверьте API /machines в браузере
echo.
echo 🌐 Адреса для проверки:
echo    - Frontend: http://localhost:3000/#/production
echo    - Backend API: http://localhost:5100/api/machines
echo    - Health Check: http://localhost:5100/api/health
echo.
pause
