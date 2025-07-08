#!/bin/bash

echo "=== Проверка компиляции TypeScript фронтенда ==="
echo "Текущая директория: $(pwd)"

cd "C:\Users\Alexey\Downloads\thewho-main\frontend"

echo ""
echo "=== Проверка типов TypeScript ==="
npx tsc --noEmit --skipLibCheck

echo ""
echo "=== Проверка с помощью React Scripts ==="
npm run build

echo ""
echo "=== Результат ==="
if [ $? -eq 0 ]; then
    echo "✅ Компиляция фронтенда успешна!"
else
    echo "❌ Ошибки компиляции найдены"
fi
