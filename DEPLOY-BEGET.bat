@echo off
echo 🚀 Подготовка Production CRM для Beget...

echo 📦 Сборка фронтенда...
cd frontend
call npm ci --production
call npm run build
cd ..

echo 📦 Сборка бэкенда...
cd backend
call npm ci --production
call npm run build
cd ..

echo 📦 Создание архива...
powershell -Command "Compress-Archive -Path backend\dist, backend\package.json, backend\package-lock.json, frontend\build, frontend\nginx.conf, .env.beget, docker-compose.beget.yml, beget-deploy, nginx, BEGET-DEPLOY-GUIDE.md -DestinationPath production-crm-beget.zip -Force"

echo ✅ Архив production-crm-beget.zip создан!
echo 🔧 Следующие шаги:
echo 1. Загрузите архив на сервер Beget
echo 2. Распакуйте архив
echo 3. Запустите beget-deploy/setup.sh

pause
