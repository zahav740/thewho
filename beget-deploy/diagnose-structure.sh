#!/bin/bash

echo "🔍 ДИАГНОСТИКА СТРУКТУРЫ ПРОЕКТА"
echo "================================="

echo ""
echo "📂 Корневая структура:"
ls -la

echo ""
echo "📂 Backend структура:"
if [ -d "backend" ]; then
    echo "✅ backend директория существует"
    ls -la backend/
else
    echo "❌ backend директория НЕ найдена"
fi

echo ""
echo "📂 Backend/dist структура:"
if [ -d "backend/dist" ]; then
    echo "✅ backend/dist существует"
    find backend/dist -type d | head -20
else
    echo "❌ backend/dist НЕ найдена"
fi

echo ""
echo "📂 Backend/dist/src структура:"
if [ -d "backend/dist/src" ]; then
    echo "✅ backend/dist/src существует"
    find backend/dist/src -name "*.js" | head -10
else
    echo "❌ backend/dist/src НЕ найдена"
fi

echo ""
echo "📂 Модули в backend/dist/src:"
if [ -d "backend/dist/src/modules" ]; then
    echo "✅ Модули найдены:"
    ls -la backend/dist/src/modules/
else
    echo "❌ backend/dist/src/modules НЕ найдена"
fi

echo ""
echo "📂 Проверка существующих .js файлов:"
echo "Всего .js файлов в backend/dist:"
find backend/dist -name "*.js" 2>/dev/null | wc -l

echo ""
echo "📂 Машины (.js файлы):"
find backend/dist -path "*machines*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "📂 Операции (.js файлы):"
find backend/dist -path "*operations*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "📂 Заказы (.js файлы):"
find backend/dist -path "*orders*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "📂 Календарь (.js файлы):"
find backend/dist -path "*calendar*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "📂 Entities (.js файлы):"
find backend/dist -path "*entities*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "📂 Migrations (.js файлы):"
find backend/dist -path "*migrations*" -name "*.js" 2>/dev/null | head -5

echo ""
echo "🔍 ПОИСК ВСЕХ НЕОБХОДИМЫХ МОДУЛЕЙ"
echo "================================="

echo "Поиск контроллеров:"
find backend/dist -name "*controller*.js" 2>/dev/null | head -10

echo ""
echo "Поиск сервисов:"
find backend/dist -name "*service*.js" 2>/dev/null | head -10

echo ""
echo "Поиск модулей:"
find backend/dist -name "*module*.js" 2>/dev/null | head -10

echo ""
echo "🔍 ПРОВЕРКА FRONTEND"
echo "==================="

if [ -d "frontend" ]; then
    echo "✅ frontend директория существует"
    ls -la frontend/
else
    echo "❌ frontend директория НЕ найдена"
fi

if [ -d "frontend/build" ]; then
    echo "✅ frontend/build существует"
    ls -la frontend/build/
else
    echo "❌ frontend/build НЕ найдена"
fi

echo ""
echo "📊 ИТОГ ДИАГНОСТИКИ:"
echo "==================="
echo "Backend exists: $([ -d backend ] && echo 'YES' || echo 'NO')"
echo "Backend/dist exists: $([ -d backend/dist ] && echo 'YES' || echo 'NO')"
echo "Backend/dist/src exists: $([ -d backend/dist/src ] && echo 'YES' || echo 'NO')"
echo "Frontend exists: $([ -d frontend ] && echo 'YES' || echo 'NO')"
echo "Frontend/build exists: $([ -d frontend/build ] && echo 'YES' || echo 'NO')"
echo "Total JS files in backend/dist: $(find backend/dist -name '*.js' 2>/dev/null | wc -l)"
