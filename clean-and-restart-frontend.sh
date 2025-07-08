#!/bin/bash

echo "🧹 Очистка кэша и перезапуск..."

# Останавливаем процессы если запущены
echo "Останавливаем существующие процессы..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true

# Переходим в папку frontend
cd frontend

# Очищаем кэш
echo "Очищаем node_modules и кэши..."
rm -rf node_modules package-lock.json
rm -rf .cache
rm -rf build

# Очищаем npm кэш
npm cache clean --force

# Устанавливаем зависимости
echo "Устанавливаем зависимости..."
npm install

# Запускаем
echo "Запускаем frontend..."
npm start

echo "✅ Готово!"
