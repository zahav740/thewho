@echo off
echo 🔧 Проверка и исправление ошибок компиляции TypeScript
echo.

echo 📂 Переходим в backend...
cd backend

echo 🧹 Очистка кэша и node_modules...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
npm cache clean --force

echo 📦 Переустановка зависимостей...
npm install

echo 🔍 Установка типов Express (если нужно)...
npm install --save-dev @types/express @types/multer

echo 🛠️ Компиляция TypeScript...
npx tsc --noEmit

echo 📝 Проверка конкретных файлов...
echo Проверяем orders-v2.controller.ts...
npx tsc --noEmit src/modules/orders/v2/orders-v2.controller.ts

echo 🎯 Попытка запуска для проверки...
npm run start:dev &
timeout /t 10 /nobreak
taskkill /f /im node.exe 2>nul

echo.
echo ✅ Проверка завершена!
echo 💡 Если ошибки остались, проверьте:
echo    1. Файл src/types/express.d.ts создан
echo    2. tsconfig.json содержит typeRoots
echo    3. @types/express установлен
echo.
pause
