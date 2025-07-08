@echo off
echo 🔧 Исправление ошибок Excel модуля...

cd "C:\Users\Alexey\Downloads\thewho-main\backend"

echo 📦 Установка XLSX библиотеки...
npm install xlsx
npm install --save-dev @types/xlsx

echo ✅ Зависимости установлены!

echo 🏗️ Проверка компиляции...
npx tsc --noEmit

echo ✅ Готово!
pause
