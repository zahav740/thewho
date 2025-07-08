@echo off
chcp 65001 > nul
echo ==========================================
echo 🔍 ДИАГНОСТИКА МОБИЛЬНОЙ ВЕРСИИ
echo ==========================================
echo.

echo ⏰ %date% %time% - Начало диагностики
echo.

REM Проверка текущей директории
echo 📁 Текущая директория: %cd%
echo.

REM Проверка наличия package.json
if not exist "package.json" (
    echo ❌ Ошибка: Не найден package.json в текущей директории
    echo Убедитесь, что скрипт запущен из директории frontend
    pause
    exit /b 1
) else (
    echo ✅ package.json найден
)

REM Проверка Node.js и npm
echo.
echo 🔍 Проверка окружения...
echo Node.js версия:
node --version
if errorlevel 1 (
    echo ❌ Node.js не найден
    pause
    exit /b 1
) else (
    echo ✅ Node.js работает
)

echo NPM версия:
npm --version
if errorlevel 1 (
    echo ❌ NPM не найден
    pause
    exit /b 1
) else (
    echo ✅ NPM работает
)

echo.
echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️ node_modules не найден, устанавливаем зависимости...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules существует
)

echo.
echo 🧪 Тест TypeScript компиляции...
call npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo ❌ Ошибки TypeScript найдены
    echo Продолжаем диагностику...
) else (
    echo ✅ TypeScript компиляция прошла успешно
)

echo.
echo 🏗️ Тест обычной сборки...
call npm run build
if errorlevel 1 (
    echo ❌ Обычная сборка не удалась
    echo 📋 Проверьте ошибки выше
    pause
    exit /b 1
) else (
    echo ✅ Обычная сборка прошла успешно
)

echo.
echo 📁 Проверка созданных файлов...
if exist "src\hooks\useMobile.ts" (
    echo ✅ useMobile.ts найден
) else (
    echo ❌ useMobile.ts не найден
)

if exist "src\components\Mobile\MobileWrapper.tsx" (
    echo ✅ MobileWrapper.tsx найден
) else (
    echo ❌ MobileWrapper.tsx не найден
)

if exist "src\styles\mobile.css" (
    echo ✅ mobile.css найден
) else (
    echo ❌ mobile.css не найден
)

echo.
echo ==========================================
echo 📊 РЕЗУЛЬТАТ ДИАГНОСТИКИ
echo ==========================================
echo.

if exist "build" (
    echo ✅ Сборка создана успешно
    echo 📁 Размер build директории:
    dir build /s /-c | find "File(s)"
) else (
    echo ❌ Сборка не создана
)

echo.
echo ⏰ Время завершения: %date% %time%
echo ==========================================

echo.
echo Нажмите любую клавишу для продолжения...
pause > nul
