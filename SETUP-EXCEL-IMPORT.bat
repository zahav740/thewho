@echo off
echo 🔧 Настройка модуля Excel импорта...

cd "C:\Users\Alexey\Downloads\thewho-main\backend"

echo 📦 Установка зависимостей...
npm install

echo 🏗️ Компиляция TypeScript...
npx tsc --noEmit

echo 🗄️ Создание таблицы excel_files...
npx typeorm migration:run -d ormconfig.ts

echo ✅ Настройка завершена!

echo 🚀 Запуск бэкенда...
npm run start:dev

pause
