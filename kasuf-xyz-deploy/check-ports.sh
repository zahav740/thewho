#!/bin/bash

echo "🔍 ДИАГНОСТИКА ПОРТОВ И КОНФИГУРАЦИИ"
echo "===================================="

# Проверка текущей директории
echo "📍 Текущая директория: $(pwd)"
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Неправильная директория! Запустите из /var/upload/"
    exit 1
fi

echo ""
echo "📋 ПРОВЕРКА КОНФИГУРАЦИОННЫХ ФАЙЛОВ"
echo "===================================="

# Проверка Backend .env
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env найден:"
    echo "   PORT: $(grep '^PORT=' backend/.env || echo 'НЕ НАЙДЕН')"
    echo "   NODE_ENV: $(grep '^NODE_ENV=' backend/.env || echo 'НЕ НАЙДЕН')"
    echo "   CORS_ORIGIN: $(grep '^CORS_ORIGIN=' backend/.env || echo 'НЕ НАЙДЕН')"
    echo "   DB_HOST: $(grep '^DB_HOST=' backend/.env || echo 'НЕ НАЙДЕН')"
else
    echo "❌ Backend .env НЕ НАЙДЕН!"
fi

echo ""

# Проверка Frontend .env
if [ -f "frontend/.env" ]; then
    echo "✅ Frontend .env найден:"
    echo "   PORT: $(grep '^PORT=' frontend/.env || echo 'НЕ НАЙДЕН')"
    echo "   REACT_APP_API_URL: $(grep '^REACT_APP_API_URL=' frontend/.env || echo 'НЕ НАЙДЕН')"
    echo "   REACT_APP_ENVIRONMENT: $(grep '^REACT_APP_ENVIRONMENT=' frontend/.env || echo 'НЕ НАЙДЕН')"
else
    echo "❌ Frontend .env НЕ НАЙДЕН!"
fi

echo ""
echo "📊 СТАТУС ПРОЦЕССОВ PM2"
echo "======================="
pm2 status 2>/dev/null || echo "❌ PM2 не установлен или нет процессов"

echo ""
echo "🌐 ПРОВЕРКА ПОРТОВ"
echo "=================="

# Проверка Backend порта
echo "Backend (должен быть 5200):"
if netstat -tlnp 2>/dev/null | grep -q ":5200 "; then
    echo "   ✅ Порт 5200 ЗАНЯТ"
    if curl -s http://localhost:5200/health >/dev/null 2>&1; then
        echo "   ✅ Backend ОТВЕЧАЕТ на 5200"
    else
        echo "   ⚠️ Порт занят, но Backend НЕ ОТВЕЧАЕТ"
    fi
else
    echo "   ❌ Порт 5200 СВОБОДЕН (Backend не запущен)"
fi

echo ""

# Проверка Frontend порта
echo "Frontend (должен быть 5201):"
if netstat -tlnp 2>/dev/null | grep -q ":5201 "; then
    echo "   ✅ Порт 5201 ЗАНЯТ"
    if curl -s http://localhost:5201 >/dev/null 2>&1; then
        echo "   ✅ Frontend ОТВЕЧАЕТ на 5201"
    else
        echo "   ⚠️ Порт занят, но Frontend НЕ ОТВЕЧАЕТ"
    fi
else
    echo "   ❌ Порт 5201 СВОБОДЕН (Frontend не запущен)"
fi

echo ""

# Проверка старых портов
echo "🔍 ПРОВЕРКА СТАРЫХ ПОРТОВ (должны быть свободны):"
if netstat -tlnp 2>/dev/null | grep -q ":5100 "; then
    echo "   ⚠️ Порт 5100 ЗАНЯТ (старый backend порт!)"
else
    echo "   ✅ Порт 5100 свободен"
fi

if netstat -tlnp 2>/dev/null | grep -q ":5101 "; then
    echo "   ⚠️ Порт 5101 ЗАНЯТ (старый frontend порт!)"
else
    echo "   ✅ Порт 5101 свободен"
fi

echo ""
echo "🧪 ТЕСТИРОВАНИЕ API"
echo "=================="

# Тест Backend
echo "Тест Backend API:"
if curl -s -w "HTTP Code: %{http_code}\n" http://localhost:5200/health 2>/dev/null; then
    echo "   ✅ Backend API работает"
else
    echo "   ❌ Backend API недоступен"
fi

echo ""

# Тест Frontend
echo "Тест Frontend:"
if curl -s -w "HTTP Code: %{http_code}\n" http://localhost:5201 >/dev/null 2>&1; then
    echo "   ✅ Frontend работает"
else
    echo "   ❌ Frontend недоступен"
fi

echo ""
echo "🌐 ВНЕШНИЙ ДОСТУП"
echo "================"

echo "Тест внешнего API (https://kasuf.xyz/api/health):"
if curl -s -w "HTTP Code: %{http_code}\n" https://kasuf.xyz/api/health 2>/dev/null; then
    echo "   ✅ Внешний API работает"
else
    echo "   ❌ Внешний API недоступен"
fi

echo ""
echo "Тест сайта (https://kasuf.xyz):"
if curl -s -w "HTTP Code: %{http_code}\n" https://kasuf.xyz >/dev/null 2>&1; then
    echo "   ✅ Сайт работает"
else
    echo "   ❌ Сайт недоступен"
fi

echo ""
echo "📋 РЕКОМЕНДАЦИИ"
echo "==============="

# Логика рекомендаций
backend_ok=false
frontend_ok=false

if netstat -tlnp 2>/dev/null | grep -q ":5200 " && curl -s http://localhost:5200/health >/dev/null 2>&1; then
    backend_ok=true
fi

if netstat -tlnp 2>/dev/null | grep -q ":5201 " && curl -s http://localhost:5201 >/dev/null 2>&1; then
    frontend_ok=true
fi

if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
    echo "✅ Всё работает правильно!"
    echo "   Порты настроены корректно (Backend: 5200, Frontend: 5201)"
elif [ "$backend_ok" = false ] && [ "$frontend_ok" = false ]; then
    echo "❌ Оба сервиса не работают. Запустите:"
    echo "   ./setup-ports.sh"
elif [ "$backend_ok" = false ]; then
    echo "❌ Backend не работает. Проверьте:"
    echo "   pm2 logs crm-backend"
    echo "   cd backend && npm run build"
    echo "   pm2 restart crm-backend"
elif [ "$frontend_ok" = false ]; then
    echo "❌ Frontend не работает. Проверьте:"
    echo "   pm2 logs crm-frontend"
    echo "   cd frontend && npm run build"
    echo "   pm2 restart crm-frontend"
fi

# Проверка старых портов
if netstat -tlnp 2>/dev/null | grep -q ":510[01] "; then
    echo ""
    echo "⚠️ ВНИМАНИЕ: Обнаружены процессы на старых портах 5100/5101!"
    echo "   Остановите их: pkill -f ':510[01]'"
    echo "   Затем запустите: ./setup-ports.sh"
fi

echo ""
echo "🔧 БЫСТРЫЕ КОМАНДЫ"
echo "=================="
echo "Настройка портов:     ./setup-ports.sh"
echo "Полный перезапуск:    pm2 delete all && ./setup-ports.sh"
echo "Статус процессов:     pm2 status"
echo "Логи Backend:         pm2 logs crm-backend"
echo "Логи Frontend:        pm2 logs crm-frontend"
echo "Диагностика снова:    ./check-ports.sh"