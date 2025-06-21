@echo off
echo ==========================================
echo 📱 ПРОСТОЙ ТЕСТ СБОРКИ
echo ==========================================
echo.

REM Шаг 1: Проверка базовых требований
echo 🔍 Шаг 1: Проверка окружения
if not exist "package.json" (
    echo ❌ package.json не найден
    pause
    exit /b 1
)
echo ✅ package.json найден

REM Шаг 2: Проверка Node.js
echo.
echo 🔍 Шаг 2: Проверка Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен
    pause
    exit /b 1
)
echo ✅ Node.js работает

REM Шаг 3: Простая сборка
echo.
echo 🏗️ Шаг 3: Пробуем собрать
call npm run build
if errorlevel 1 (
    echo ❌ Сборка не удалась - смотрите ошибки выше
    pause
    exit /b 1
)

echo ✅ Сборка прошла успешно!
echo 📁 Создана папка build/
pause
