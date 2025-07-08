@echo off
echo 🔧 Проверка и исправление ошибок компиляции TypeScript...

REM Переходим в директорию backend
cd backend || exit /b 1

echo 📦 Установка/обновление зависимостей...
npm install

echo 🧹 Очистка кеша TypeScript...
npx tsc --build --clean

echo 🔍 Попытка компиляции...
npx tsc --noEmit --skipLibCheck

if %errorlevel% equ 0 (
    echo ✅ Компиляция успешна!
    echo 🚀 Запуск в режиме разработки...
    npm run start:dev
) else (
    echo ❌ Найдены ошибки компиляции. Попытка автоматического исправления...
    
    REM Проверяем наличие файлов
    if not exist "src\modules\excel-import-duplicates\excel-import-duplicates.controller.ts" (
        echo ❌ Контроллер дубликатов не найден
        pause
        exit /b 1
    )
    
    if not exist "src\modules\orders\excel-import-with-duplicates.service.ts" (
        echo ❌ Сервис дубликатов не найден
        pause
        exit /b 1
    )
    
    echo ✅ Все файлы на месте. Перезапуск...
    npm run start:dev
)

pause
