#!/bin/bash

# Переходим в папку backend
cd /c/Users/Alexey/Downloads/thewho-main/backend

echo "=== Проверка TypeScript компиляции ==="
echo "Текущая директория: $(pwd)"

# Запускаем TypeScript компилятор для проверки
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript компиляция успешна!"
else
    echo "❌ Найдены ошибки в TypeScript"
fi
