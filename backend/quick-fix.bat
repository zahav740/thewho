@echo off
echo 🔧 Быстрое исправление и компиляция backend...
echo.

cd "C:\Users\apule\Downloads\TheWho\production-crm\backend"

echo 📦 Проверка зависимостей...
if not exist "node_modules\@types\express" (
    echo ⚠️ Устанавливаем недостающие типы...
    call npm install --save-dev @types/express @types/multer
) else (
    echo ✅ Типы Express найдены
)

echo.
echo 🏗️ Компиляция проекта...
call npx nest build

if %errorlevel% equ 0 (
    echo ✅ Компиляция успешна!
    echo.
    echo 🚀 Запуск backend в продакшн режиме...
    call npm run start:prod
) else (
    echo ❌ Ошибки компиляции обнаружены!
    echo.
    echo 🔍 Подробная диагностика TypeScript...
    call npx tsc --noEmit --listFiles | findstr error
    echo.
    echo 💡 Попробуем запуск в dev режиме...
    call npm run start:dev
)

pause