#!/bin/bash

# Переходим в папку backend
cd "C:\Users\Alexey\Downloads\thewho-main\backend"

echo "=== Проверка компиляции TypeScript ==="
echo "Текущая директория: $(pwd)"

echo ""
echo "=== Компиляция проекта ==="
npm run build

echo ""
echo "=== Результат компиляции ==="
if [ $? -eq 0 ]; then
    echo "✅ Компиляция успешна!"
else
    echo "❌ Ошибки компиляции найдены"
fi
