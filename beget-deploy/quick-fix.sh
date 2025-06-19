#!/bin/bash

echo "⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ СТРУКТУРЫ НА BEGET"
echo "======================================="

# Остановка текущих процессов
echo "🛑 Остановка Docker контейнеров..."
docker-compose -f docker-compose.beget.yml down 2>/dev/null || echo "Docker не запущен"

# 1. Диагностика
echo ""
echo "🔍 Шаг 1: Диагностика структуры..."
./beget-deploy/diagnose-structure.sh > diagnosis.log 2>&1
echo "📋 Диагностика сохранена в diagnosis.log"

# 2. Исправление структуры
echo ""
echo "🔧 Шаг 2: Исправление структуры модулей..."
./beget-deploy/fix-structure.sh

# 3. Экстренное восстановление если нужно
echo ""
echo "🚨 Шаг 3: Проверка и экстренное восстановление..."
if [ ! -f "backend/dist/src/main.js" ]; then
    echo "⚠️  Основные файлы отсутствуют, запускаем экстренное восстановление..."
    ./beget-deploy/emergency-fix.sh
fi

# 4. Финальная проверка
echo ""
echo "✅ Шаг 4: Финальная проверка..."
echo "Backend structure:"
echo "- main.js: $([ -f backend/dist/src/main.js ] && echo '✅' || echo '❌')"
echo "- Machines: $(ls backend/dist/src/modules/machines/ 2>/dev/null | wc -l) файлов"
echo "- Operations: $(ls backend/dist/src/modules/operations/ 2>/dev/null | wc -l) файлов"
echo "- Orders: $(ls backend/dist/src/modules/orders/ 2>/dev/null | wc -l) файлов"
echo "- Calendar: $(ls backend/dist/src/modules/calendar/ 2>/dev/null | wc -l) файлов"
echo "- Entities: $(ls backend/dist/src/database/entities/ 2>/dev/null | wc -l) файлов"

# 5. Перезапуск сервисов
echo ""
echo "🚀 Шаг 5: Перезапуск сервисов..."
if [ -f "docker-compose.beget.yml" ]; then
    echo "🐳 Запуск Docker контейнеров..."
    docker-compose -f docker-compose.beget.yml up -d
    
    echo "⏳ Ожидание запуска сервисов..."
    sleep 30
    
    echo "📊 Статус сервисов:"
    docker-compose -f docker-compose.beget.yml ps
else
    echo "⚠️  docker-compose.beget.yml не найден, запуск вручную..."
    if [ -f "backend/dist/src/main.js" ]; then
        echo "🚀 Запуск backend напрямую..."
        cd backend
        node dist/src/main.js &
        echo "Backend PID: $!"
        cd ..
    fi
fi

echo ""
echo "🎉 БЫСТРОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "================================"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте логи: docker-compose -f docker-compose.beget.yml logs"
echo "2. Проверьте API: curl http://localhost:3001/health"
echo "3. Проверьте frontend: curl http://localhost:3000"
echo ""
echo "📁 Полная диагностика доступна в файле diagnosis.log"
