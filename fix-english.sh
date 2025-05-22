#!/bin/bash

echo "🔧 Исправление проблемы с английской версией приложения..."

# Переходим в директорию приложения
cd "$(dirname "$0")"

echo "📁 Текущая директория: $(pwd)"

# 1. Очищаем localStorage
echo "🧹 Очистка localStorage..."
cat > clear-localstorage.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Clear LocalStorage</title>
</head>
<body>
    <script>
        localStorage.clear();
        localStorage.setItem('language', 'en');
        console.log('LocalStorage очищен, установлен английский язык');
        alert('LocalStorage очищен! Теперь можно запустить приложение.');
    </script>
    <h1>LocalStorage очищен</h1>
    <p>Английский язык установлен по умолчанию.</p>
</body>
</html>
EOF

# 2. Проверяем зависимости
echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "⚠️  Зависимости не установлены. Устанавливаем..."
    npm install
else
    echo "✅ Зависимости уже установлены"
fi

# 3. Создаем резервную копию текущей конфигурации i18n
echo "💾 Создание резервной копии i18n..."
cp src/i18n/index.ts src/i18n/index.ts.backup

# 4. Применяем исправленную конфигурацию
echo "🔧 Применение исправленной конфигурации i18n..."
cp src/i18n/index-debug.ts src/i18n/index.ts

# 5. Запускаем приложение
echo "🚀 Запуск приложения в режиме разработки..."
echo "Откройте clear-localstorage.html в браузере, затем запустите:"
echo "npm run dev"

echo "✅ Готово! Инструкции:"
echo "1. Откройте clear-localstorage.html в браузере"
echo "2. Запустите: npm run dev"
echo "3. Откройте http://localhost:5173"
