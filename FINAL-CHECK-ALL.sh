#!/bin/bash

echo "=============================================="
echo "   БЫСТРАЯ ПРОВЕРКА ВСЕХ ИСПРАВЛЕНИЙ"
echo "=============================================="
echo

# Проверка Backend
echo "🔧 Проверяем Backend..."
cd "$(dirname "$0")/backend"
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ Backend: TypeScript компиляция БЕЗ ОШИБОК!"
else
    echo "❌ Backend: Остались ошибки TypeScript"
    exit 1
fi

echo
echo "🎨 Проверяем Frontend..."
cd "../frontend"
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ Frontend: TypeScript компиляция БЕЗ ОШИБОК!"
else
    echo "❌ Frontend: Остались ошибки TypeScript"
    exit 1
fi

echo
echo "🎉 ВСЕ ИСПРАВЛЕНО! Можно запускать:"
echo "1. Backend: cd backend && npm run migration:run && npm run start:dev"
echo "2. Frontend: cd frontend && npm start"
echo "3. Открыть: http://localhost:5101/excel-import"
echo "=============================================="
