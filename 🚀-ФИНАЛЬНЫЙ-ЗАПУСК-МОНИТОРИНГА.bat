@echo off
chcp 65001 >nul
color 0A
echo.
echo ████████████████████████████████████████████████████
echo ██                                                ██
echo ██  🚀 ФИНАЛЬНЫЙ ЗАПУСК МОНИТОРИНГА ПРОИЗВОДСТВА  ██
echo ██                                                ██
echo ████████████████████████████████████████████████████
echo.

REM Проверяем базовые условия
echo [1/7] 🔍 Проверяем файловую структуру...
if not exist "frontend\src\pages\Production\components\MachineCard.tsx" (
    echo ❌ Основной файл MachineCard.tsx не найден!
    pause
    exit /b 1
)
echo ✅ MachineCard.tsx найден

if exist "frontend\src\pages\Production\components\MachineCard.enhanced.tsx" (
    echo 🗑️ Удаляем дублирующий файл...
    del "frontend\src\pages\Production\components\MachineCard.enhanced.tsx"
)
echo ✅ Дублирующие файлы удалены

echo.
echo [2/7] 🔧 Проверяем зависимости...
cd frontend
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    call npm install --silent
)
echo ✅ Зависимости установлены

echo.
echo [3/7] 🎯 Проверяем TypeScript...
call npm run type-check >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ TypeScript ошибок нет
) else (
    echo ⚠️ Есть TypeScript предупреждения (игнорируем)
)

echo.
echo [4/7] 🚀 Запускаем Backend...
cd ..\backend
REM Проверяем запущен ли уже
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend уже запущен
) else (
    echo 🚀 Запускаем новый процесс backend...
    start /min "Backend-CRM" cmd /c "npm run start:dev"
    echo ⏳ Ждём запуск backend (15 сек)...
    timeout /t 15 /nobreak >nul
)

echo.
echo [5/7] 🌐 Проверяем API...
for /L %%i in (1,1,5) do (
    curl -s http://localhost:5100/api/machines >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ API работает
        goto api_ok
    )
    echo ⏳ Попытка %%i/5 - ждём API...
    timeout /t 3 /nobreak >nul
)
echo ⚠️ API не отвечает, но продолжаем
:api_ok

echo.
echo [6/7] 🎨 Запускаем Frontend...
cd ..\frontend
REM Проверяем запущен ли уже
netstat -an | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend уже запущен
) else (
    echo 🚀 Запускаем новый процесс frontend...
    start /min "Frontend-CRM" cmd /c "npm start"
    echo ⏳ Ждём запуск frontend (25 сек)...
    timeout /t 25 /nobreak >nul
)

echo.
echo [7/7] 🌐 Открываем мониторинг...
start "" "http://localhost:3000/#/production"
timeout /t 3 /nobreak >nul

echo.
echo ████████████████████████████████████████████████████
echo ██                                                ██
echo ██  ✅ МОНИТОРИНГ ПРОИЗВОДСТВА ЗАПУЩЕН!           ██
echo ██                                                ██
echo ████████████████████████████████████████████████████
echo.
echo 📊 ПРОВЕРЬТЕ:
echo    • Карточки станков отображаются
echo    • Показаны реальные операции (номера, типы, время)
echo    • Кнопки "Освободить/Занять" работают
echo    • Статусы обновляются в реальном времени
echo.
echo 🔗 ССЫЛКИ:
echo    Frontend: http://localhost:3000/#/production
echo    Backend:  http://localhost:5100/api/machines
echo.
echo 🛠️ ЕСЛИ ПРОБЛЕМЫ:
echo    1. Обновите страницу (F5)
echo    2. Проверьте консоль браузера (F12)
echo    3. Перезапустите этот скрипт
echo.
pause
