#!/bin/bash

echo "🔍 Проверка компиляции frontend..."
cd "C:\Users\Alexey\Downloads\thewho-main\frontend"

echo "📦 Проверяем зависимости..."
npm list @types/react @types/node typescript --depth=0

echo ""
echo "🔧 Попытка компиляции..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Компиляция успешна!"
else
    echo "❌ Есть ошибки компиляции"
    echo ""
    echo "🔍 Попробуем найти проблемы с синтаксисом..."
    npx tsc --noEmit --skipLibCheck
fi
