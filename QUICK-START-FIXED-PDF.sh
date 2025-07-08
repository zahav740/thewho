#!/bin/bash

# ================================================
# БЫСТРЫЙ ЗАПУСК ИСПРАВЛЕННОЙ СИСТЕМЫ PDF
# ================================================
# Этот скрипт автоматически применяет все исправления
# и запускает обновленную систему
# ================================================

echo "🔧 Начинаем исправление системы PDF..."

# 1. Остановить текущие процессы
echo "⏹️ Остановка текущих процессов..."
pkill -f "npm run start"
pkill -f "node.*backend"
pkill -f "node.*frontend"

# 2. Создать необходимые папки
echo "📁 Создание структуры папок..."
mkdir -p backend/uploads/pdf
chmod -R 755 backend/uploads

# 3. Обновить backend
echo "🔄 Обновление backend..."
cd backend

# Установить зависимости (если нужно)
npm install

# Применить SQL скрипт очистки (нужно указать параметры подключения к БД)
echo "🗄️ Очистка базы данных..."
echo "⚠️ ВНИМАНИЕ: Необходимо выполнить SQL скрипт вручную:"
echo "   psql -d your_database_name -f src/modules/orders/pdf-system-cleanup.sql"
echo "   Нажмите Enter после выполнения SQL скрипта..."
read -p ""

# Собрать backend
echo "🔨 Сборка backend..."
npm run build

# 4. Обновить frontend  
echo "🔄 Обновление frontend..."
cd ../frontend

# Установить зависимости (если нужно)
npm install

# Собрать frontend
echo "🔨 Сборка frontend..."
npm run build

# 5. Запустить систему
echo "🚀 Запуск обновленной системы..."

# Запуск backend
cd ../backend
echo "▶️ Запуск backend на порту 5100..."
npm run start:dev &
BACKEND_PID=$!

# Ждем запуска backend
sleep 5

# Запуск frontend  
cd ../frontend
echo "▶️ Запуск frontend на порту 3000..."
npm start &
FRONTEND_PID=$!

# 6. Проверка работоспособности
echo "🔍 Проверка работоспособности..."

# Ждем запуска сервисов
sleep 10

# Проверяем backend
echo "🌐 Проверка backend API..."
curl -s http://localhost:5100/api/orders/pdf/statistics > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend API доступен"
else
    echo "❌ Backend API недоступен"
fi

# Проверяем frontend
echo "🌐 Проверка frontend..."
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend доступен"
else
    echo "❌ Frontend недоступен"
fi

# 7. Итоговая информация
echo ""
echo "================================================"
echo "🎉 ИСПРАВЛЕНИЕ СИСТЕМЫ PDF ЗАВЕРШЕНО!"
echo "================================================"
echo ""
echo "📋 Доступные сервисы:"
echo "   🔗 Frontend: http://localhost:3000"
echo "   🔗 Backend API: http://localhost:5100/api"
echo "   🔗 PDF API: http://localhost:5100/api/orders/pdf"
echo ""
echo "📊 Для проверки статистики PDF выполните:"
echo "   curl http://localhost:5100/api/orders/pdf/statistics"
echo ""
echo "🔧 Новые возможности:"
echo "   ✅ Организация файлов по папкам номера чертежа"
echo "   ✅ Проверка и обработка дубликатов"  
echo "   ✅ Drag & Drop загрузка PDF"
echo "   ✅ Множественные режимы просмотра"
echo "   ✅ Автоматическая очистка устаревших данных"
echo ""
echo "📝 Логи:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 Для остановки:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "================================================"
echo "Система готова к работе! 🚀"
echo "================================================"

# Функция для корректной остановки при Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Остановка системы..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Система остановлена"
    exit 0
}

# Обработчик сигнала остановки
trap cleanup SIGINT SIGTERM

# Ожидание завершения процессов
echo "💡 Нажмите Ctrl+C для остановки системы"
wait
