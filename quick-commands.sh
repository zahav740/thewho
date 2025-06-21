#!/bin/bash
# Быстрые команды для исправления портов на Beget

echo "🚨 БЫСТРОЕ ИСПРАВЛЕНИЕ ПОРТОВ"
echo "Выполните эти команды по порядку в SSH:"
echo

echo "1. Остановка процессов:"
echo "pm2 delete all"
echo

echo "2. Исправление Backend порта:"
echo "cd /var/upload/backend"
echo "sed -i 's/PORT=5100/PORT=5200/g' .env"
echo "sed -i 's/localhost:5101/localhost:5201/g' .env"
echo "echo 'CORS_ORIGIN=https://kasuf.xyz' >> .env"
echo

echo "3. Исправление Frontend порта:"
echo "cd /var/upload/frontend"
echo "echo 'PORT=5201' > .env"
echo "echo 'REACT_APP_API_URL=https://kasuf.xyz/api' >> .env"
echo

echo "4. Обновление PM2 конфигурации:"
echo "cd /var/upload"
echo "cat > ecosystem.config.js << 'EOF'"
echo "module.exports = {"
echo "  apps: ["
echo "    {"
echo "      name: 'crm-backend',"
echo "      script: '/var/upload/backend/dist/main.js',"
echo "      cwd: '/var/upload/backend',"
echo "      env: { NODE_ENV: 'production', PORT: 5200 }"
echo "    },"
echo "    {"
echo "      name: 'crm-frontend',"
echo "      script: 'serve',"
echo "      args: '-s build -l 5201',"
echo "      cwd: '/var/upload/frontend',"
echo "      env: { NODE_ENV: 'production', PORT: 5201 }"
echo "    }"
echo "  ]"
echo "};"
echo "EOF"
echo

echo "5. Пересборка и запуск:"
echo "cd backend && npm run build && cd .."
echo "cd frontend && npm run build && cd .."
echo "npm install -g serve"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo

echo "6. Проверка:"
echo "pm2 status"
echo "curl http://localhost:5200/health"
echo "curl http://localhost:5201"
echo

echo "✅ ГОТОВО! Теперь проверьте https://kasuf.xyz"