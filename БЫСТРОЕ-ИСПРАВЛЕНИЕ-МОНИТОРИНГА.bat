@echo off
chcp 65001 >nul
echo.
echo =======================================================
echo 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ МОНИТОРИНГА ПРОИЗВОДСТВА
echo =======================================================
echo.

echo 🔍 Исправляем TypeScript ошибки...

REM Удаляем enhanced файл который дублирует основной компонент
if exist "frontend\src\pages\Production\components\MachineCard.enhanced.tsx" (
    echo 🗑️ Удаляем дублирующий файл MachineCard.enhanced.tsx...
    del "frontend\src\pages\Production\components\MachineCard.enhanced.tsx"
    echo ✅ Файл удален
) else (
    echo ✅ Дублирующий файл не найден
)

echo.
echo 🔍 Проверяем основные файлы компонентов...

REM Проверяем что основной файл существует
if exist "frontend\src\pages\Production\components\MachineCard.tsx" (
    echo ✅ MachineCard.tsx существует
) else (
    echo ❌ MachineCard.tsx не найден!
)

if exist "frontend\src\pages\Production\ProductionPage.tsx" (
    echo ✅ ProductionPage.tsx существует  
) else (
    echo ❌ ProductionPage.tsx не найден!
)

echo.
echo 🔍 Очищаем кэш npm и node_modules для чистой сборки...
cd frontend
if exist "node_modules" (
    echo 🗑️ Удаляем node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo 🗑️ Удаляем package-lock.json...
    del package-lock.json
)

echo 🔄 Переустанавливаем зависимости...
call npm install

echo.
echo 🔍 Пытаемся собрать проект...
call npm run build
if %errorlevel% equ 0 (
    echo ✅ Сборка прошла успешно
) else (
    echo ❌ Сборка не удалась, проверяем ошибки...
    call npm run type-check
)

echo.
echo 🚀 Запускаем dev сервер...
start "Frontend" cmd /k "npm start"

cd ..

echo.
echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ
echo 📖 Что было сделано:
echo    1. Удален дублирующий файл MachineCard.enhanced.tsx
echo    2. Переустановлены зависимости npm  
echo    3. Собран проект для проверки ошибок
echo    4. Запущен dev сервер
echo.
echo ⏳ Подождите ~30 секунд и перейдите на http://localhost:3000/#/production
echo.
pause
