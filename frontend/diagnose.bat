@echo off
chcp 65001 > nul
echo ==========================================
echo 🔍 ДИАГНОСТИКА ПРОБЛЕМ СБОРКИ
echo ==========================================
echo.

echo ⏰ Время начала диагностики: %date% %time%
echo.

REM Проверка 1: Базовые файлы
echo 📁 ПРОВЕРКА 1: Структура проекта
echo ==========================================
echo Текущая директория: %cd%
echo.

if exist "package.json" (
    echo ✅ package.json найден
    echo 📄 Содержимое package.json:
    type package.json | findstr "name\|version\|scripts"
) else (
    echo ❌ package.json НЕ НАЙДЕН
    echo 💡 Убедитесь, что запускаете из папки frontend
    goto :end
)

if exist "src" (
    echo ✅ папка src найдена
) else (
    echo ❌ папка src НЕ НАЙДЕНА
)

if exist "public" (
    echo ✅ папка public найдена
) else (
    echo ❌ папка public НЕ НАЙДЕНА
)

echo.
REM Проверка 2: Node.js и npm
echo 🔧 ПРОВЕРКА 2: Окружение
echo ==========================================

echo Проверка Node.js...
node --version > temp_node.txt 2>&1
if errorlevel 1 (
    echo ❌ Node.js НЕ НАЙДЕН или НЕ РАБОТАЕТ
    echo 💡 Установите Node.js с https://nodejs.org
    type temp_node.txt
    del temp_node.txt
    goto :end
) else (
    set /p NODE_VER=<temp_node.txt
    echo ✅ Node.js работает: %NODE_VER%
    del temp_node.txt
)

echo Проверка npm...
npm --version > temp_npm.txt 2>&1
if errorlevel 1 (
    echo ❌ npm НЕ НАЙДЕН или НЕ РАБОТАЕТ
    type temp_npm.txt
    del temp_npm.txt
    goto :end
) else (
    set /p NPM_VER=<temp_npm.txt
    echo ✅ npm работает: %NPM_VER%
    del temp_npm.txt
)

echo.
REM Проверка 3: Зависимости
echo 📦 ПРОВЕРКА 3: Зависимости
echo ==========================================

if exist "node_modules" (
    echo ✅ node_modules найден
    echo 📊 Размер node_modules:
    for /f "tokens=3" %%a in ('dir node_modules /s /-c 2^>nul ^| find "File(s)" 2^>nul') do echo Файлов: %%a
) else (
    echo ❌ node_modules НЕ НАЙДЕН
    echo 💡 Требуется: npm install
)

if exist "package-lock.json" (
    echo ✅ package-lock.json найден
) else (
    echo ⚠️ package-lock.json не найден (это нормально)
)

echo.
REM Проверка 4: TypeScript компиляция
echo 🔍 ПРОВЕРКА 4: TypeScript
echo ==========================================

echo Проверка базовой TypeScript компиляции...
npx tsc --noEmit --skipLibCheck > temp_tsc.txt 2>&1
if errorlevel 1 (
    echo ❌ НАЙДЕНЫ ОШИБКИ TYPESCRIPT:
    echo ----------------------------------------
    type temp_tsc.txt
    echo ----------------------------------------
    echo.
    echo 💡 НУЖНО ИСПРАВИТЬ ОШИБКИ ВЫШЕ
    del temp_tsc.txt
) else (
    echo ✅ TypeScript компиляция прошла успешно
    del temp_tsc.txt
)

echo.
REM Проверка 5: Тест простой сборки
echo 🏗️ ПРОВЕРКА 5: Тест сборки
echo ==========================================

echo Попытка тестовой сборки...
echo (это может занять несколько минут)

REM Устанавливаем переменные окружения
set GENERATE_SOURCEMAP=false
set CI=false

echo Запуск npm run build...
npm run build > temp_build.txt 2>&1
if errorlevel 1 (
    echo ❌ СБОРКА НЕ УДАЛАСЬ
    echo ----------------------------------------
    echo ПОСЛЕДНИЕ СТРОКИ ОШИБКИ:
    powershell -Command "Get-Content temp_build.txt | Select-Object -Last 20"
    echo ----------------------------------------
    echo.
    echo 📄 Полный лог ошибки сохранен в temp_build.txt
    echo Откройте этот файл для подробного анализа
) else (
    echo ✅ СБОРКА ПРОШЛА УСПЕШНО!
    del temp_build.txt
    
    if exist "build" (
        echo ✅ Папка build создана
        echo 📊 Содержимое build:
        dir build /b
    ) else (
        echo ❌ Папка build не создалась (странно...)
    )
)

echo.
REM Проверка 6: Мобильные файлы
echo 📱 ПРОВЕРКА 6: Мобильные файлы
echo ==========================================

if exist "src\hooks\useMobile.ts" (
    echo ✅ useMobile.ts найден
) else (
    echo ❌ useMobile.ts НЕ НАЙДЕН
)

if exist "src\components\Mobile\MobileWrapper.tsx" (
    echo ✅ MobileWrapper.tsx найден
) else (
    echo ❌ MobileWrapper.tsx НЕ НАЙДЕН
)

if exist "src\styles\mobile.css" (
    echo ✅ mobile.css найден
) else (
    echo ❌ mobile.css НЕ НАЙДЕН
)

if exist "mobile-styles.css" (
    echo ✅ mobile-styles.css найден
) else (
    echo ❌ mobile-styles.css НЕ НАЙДЕН
)

if exist "mobile-logic.js" (
    echo ✅ mobile-logic.js найден
) else (
    echo ❌ mobile-logic.js НЕ НАЙДЕН
)

echo.
REM Итоговый отчет
echo 📋 ИТОГОВЫЙ ОТЧЕТ
echo ==========================================

echo Проблемы, которые нужно исправить:
echo.

if not exist "package.json" echo 🔴 Запустите скрипт из папки frontend
if not exist "node_modules" echo 🔴 Выполните: npm install
if exist "temp_tsc.txt" echo 🔴 Исправьте ошибки TypeScript
if exist "temp_build.txt" echo 🔴 Проверьте ошибки сборки в temp_build.txt

echo.
echo Следующие шаги:
echo 1. Исправьте проблемы выше
echo 2. Запустите диагностику снова
echo 3. Если все ✅, запустите основной батник

:end
echo.
echo ⏰ Время окончания: %date% %time%
echo.
echo Нажмите любую клавишу для выхода...
pause > nul
