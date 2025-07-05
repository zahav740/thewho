@echo off
chcp 65001 > nul
echo.
echo 🚀 ЗАПУСК BACKEND НА ПОРТУ 5100
echo ==============================
echo.

cd /d "%~dp0"

echo 📁 Переходим в backend...
cd backend

echo.
echo 🔍 Проверяем текущую директорию...
echo Текущая папка: %CD%

echo.
echo 📋 Проверяем наличие файлов...
if exist "src\main.ts" (
    echo ✅ main.ts найден
) else (
    echo ❌ main.ts НЕ НАЙДЕН!
    echo 📂 Содержимое папки:
    dir
    pause
    exit /b 1
)

echo.
echo 🔍 Проверяем Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не найден!
    pause
    exit /b 1
)

echo.
echo 📦 Проверяем зависимости...
if exist "node_modules" (
    echo ✅ node_modules найден
) else (
    echo ⚠️ node_modules не найден, устанавливаем зависимости...
    call npm install
)

echo.
echo 🔧 Проверяем TypeScript компиляцию...
npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Есть ошибки TypeScript!
    echo 🔧 Попробуйте сначала запустить исправления
    pause
    exit /b 1
)

echo.
echo ✅ TypeScript компиляция успешна!
echo.
echo 🚀 Запускаем backend на порту 5100...
echo 🌐 Backend будет доступен по адресу: http://localhost:5100/api
echo 📚 Swagger документация: http://localhost:5100/api/docs
echo.

npx ts-node --transpile-only src/main.ts

echo.
echo ⚠️ Backend завершил работу. Проверьте ошибки выше.
pause
