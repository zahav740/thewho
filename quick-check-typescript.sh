#!/bin/bash

echo "=========================================="
echo "   БЫСТРАЯ ПРОВЕРКА TYPESCRIPT"
echo "=========================================="
echo

cd "$(dirname "$0")/frontend"

echo "Проверка TypeScript компиляции..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo
    echo "✅ УСПЕХ: TypeScript компиляция прошла без ошибок!"
    echo "✅ Excel Import модуль готов к использованию!"
    echo
    echo "Запуск проекта:"
    echo "1. Backend: cd backend && npm run migration:run && npm run start:dev"
    echo "2. Frontend: cd frontend && npm start"
    echo "3. Откройте: http://localhost:5101/excel-import"
else
    echo
    echo "❌ ОШИБКА: Остались ошибки TypeScript"
    echo "Проверьте вывод выше для деталей"
fi

echo
echo "=========================================="
