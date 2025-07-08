@echo off
echo 🚀 Запуск Excel импорта с ExcelJS (уже установлен)...

cd "C:\Users\Alexey\Downloads\thewho-main\backend"

echo 🗄️ Запуск миграций для создания таблицы excel_files...
npx typeorm migration:run -d ormconfig.ts

echo 🏗️ Проверка компиляции TypeScript...
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo ✅ Компиляция успешна!
    echo 🚀 Запуск сервера...
    npm run start:dev
) else (
    echo ❌ Ошибки компиляции! Проверьте логи выше.
    pause
)
