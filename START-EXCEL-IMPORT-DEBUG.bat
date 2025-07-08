@echo off
echo 🔧 Запуск исправленного Excel импорта с отладкой...

cd "C:\Users\Alexey\Downloads\thewho-main\backend"

echo 🗄️ Запуск миграций для создания таблицы excel_files...
npx typeorm migration:run -d ormconfig.ts

echo 🏗️ Проверка компиляции TypeScript...
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo ✅ Компиляция успешна!
    echo 🚀 Запуск сервера с отладкой Excel импорта...
    echo.
    echo 📋 В логах будут детальные данные об обработке Excel файлов
    echo 🔍 Следите за сообщениями с эмодзи 📂 🔍 🔧 ✅ ❌ ⚠️
    echo.
    npm run start:dev
) else (
    echo ❌ Ошибки компиляции! Проверьте логи выше.
    pause
)
