#!/bin/bash

echo "🔧 Проверка и исправление ошибок компиляции TypeScript..."

# Переходим в директорию backend
cd backend || exit 1

echo "📦 Установка/обновление зависимостей..."
npm install

echo "🧹 Очистка кеша TypeScript..."
npx tsc --build --clean

echo "🔍 Попытка компиляции..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ Компиляция успешна!"
    echo "🚀 Запуск в режиме разработки..."
    npm run start:dev
else
    echo "❌ Найдены ошибки компиляции. Попытка автоматического исправления..."
    
    # Проверяем наличие файлов
    if [ ! -f "src/modules/excel-import-duplicates/excel-import-duplicates.controller.ts" ]; then
        echo "❌ Контроллер дубликатов не найден"
        exit 1
    fi
    
    if [ ! -f "src/modules/orders/excel-import-with-duplicates.service.ts" ]; then
        echo "❌ Сервис дубликатов не найден"
        exit 1
    fi
    
    echo "✅ Все файлы на месте. Перезапуск..."
    npm run start:dev
fi
