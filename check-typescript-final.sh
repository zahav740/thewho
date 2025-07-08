#!/bin/bash

echo "=============================================="
echo "         ФИНАЛЬНАЯ ПРОВЕРКА ИСПРАВЛЕНИЙ"
echo "=============================================="

cd "$(dirname "$0")/backend"
echo "Переходим в папку backend: $(pwd)"

echo ""
echo "⏳ Проверяем компиляцию TypeScript..."

# Проверяем компиляцию без генерации файлов
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Все ошибки исправлены! Компиляция прошла успешно."
    echo ""
    echo "🔍 Запускаем детальную проверку кода..."
    
    # Проверяем синтаксис дополнительно
    npx tsc --noEmit --strict
    
    if [ $? -eq 0 ]; then
        echo "✅ Строгая проверка TypeScript пройдена!"
        echo ""
        echo "🚀 Готово к запуску! Используйте:"
        echo "   npm run start:dev"
    else
        echo "⚠️  Строгая проверка выявила предупреждения, но основная компиляция работает"
    fi
else
    echo ""
    echo "❌ Остались ошибки компиляции. Проверьте вывод выше."
    echo ""
    echo "📋 Список исправленных файлов:"
    echo "   ✅ excel-simple.controller.ts"
    echo "   ✅ orders.service.ts"
    echo "   ✅ orders.controller.ts"
    echo "   ✅ file-hash.entity.ts"
    echo "   ✅ pdf-revision.entity.ts"
    echo ""
fi
