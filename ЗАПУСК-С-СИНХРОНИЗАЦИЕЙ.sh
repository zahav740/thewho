#!/bin/bash

# 🚀 ЗАПУСК СИСТЕМЫ С СИНХРОНИЗАЦИЕЙ PRODUCTION ↔ SHIFTS
# 
# Этот скрипт запускает обновленную систему с полной синхронизацией
# между модулями Производство и Смены

echo "🔥 Запуск Production CRM с полной синхронизацией..."
echo ""
echo "✨ Новые возможности:"
echo "   🔄 Автоматическая синхронизация Production ↔ Shifts"
echo "   📡 Real-time обновления"
echo "   📊 Мониторинг прогресса в реальном времени"
echo "   🎯 Автоматическое создание смен при назначении операций"
echo ""

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js для продолжения."
    exit 1
fi

# Проверяем наличие PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не найден. Убедитесь что PostgreSQL запущен."
    exit 1
fi

echo "1️⃣ Запуск Backend..."
cd backend

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей backend..."
    npm install
fi

# Запускаем backend в фоне
echo "🚀 Запуск Backend на порту 5100..."
npm run start:dev &
BACKEND_PID=$!

# Ждем запуска backend
echo "⏳ Ожидание запуска backend..."
sleep 10

# Проверяем что backend запущен
if curl -s "http://localhost:5100/api/health" > /dev/null; then
    echo "✅ Backend запущен успешно"
else
    echo "❌ Ошибка запуска backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "2️⃣ Запуск Frontend..."
cd ../frontend

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей frontend..."
    npm install
fi

echo "🚀 Запуск Frontend на порту 3000..."
npm start &
FRONTEND_PID=$!

echo "⏳ Ожидание запуска frontend..."
sleep 15

echo ""
echo "✅ Система запущена!"
echo ""
echo "🌐 Доступные ссылки:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5100/api"
echo "   API Docs: http://localhost:5100/api/docs"
echo ""
echo "🎯 Тестирование синхронизации:"
echo "   1. Откройте Production: http://localhost:3000/production"
echo "   2. Откройте Shifts: http://localhost:3000/shifts"
echo "   3. Выберите операцию в Production"
echo "   4. Проверьте автоматическое появление в Shifts"
echo "   5. Заполните объем в Shifts"
echo "   6. Проверьте обновление в Production"
echo ""
echo "🧪 Автоматический тест:"
echo "   ./ТЕСТ-СИНХРОНИЗАЦИИ.sh"
echo ""
echo "📚 Документация:"
echo "   ДОКУМЕНТАЦИЯ-СИНХРОНИЗАЦИИ.md"
echo ""

# Функция для корректного завершения
cleanup() {
    echo ""
    echo "🛑 Остановка системы..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Система остановлена"
    exit 0
}

# Обработка сигналов завершения
trap cleanup SIGINT SIGTERM

echo "🔄 Система работает. Нажмите Ctrl+C для остановки."
echo ""

# Мониторинг процессов
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend остановлен"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend остановлен"
        cleanup
    fi
    
    sleep 5
done
