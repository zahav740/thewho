@echo off
REM Production CRM - Build and Deploy Script for Windows
REM Этот скрипт собирает и запускает продакшен версию

echo 🚀 Deploying Production CRM System...

REM Проверяем, что Docker установлен
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не установлен. Установите Docker и попробуйте снова.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова.
    pause
    exit /b 1
)

REM Останавливаем предыдущие контейнеры
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.prod.yml --env-file .env.prod down

REM Удаляем старые образы (опционально)
echo 🗑️ Removing old images...
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --rmi all --volumes --remove-orphans

REM Собираем новые образы
echo 🔨 Building new images...
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

REM Запускаем контейнеры
echo 🚀 Starting production containers...
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

REM Ждем запуска
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak

REM Проверяем статус
echo 📊 Checking service status...
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

REM Показываем логи
echo 📜 Recent logs:
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=20

echo.
echo ✅ Production deployment completed!
echo 🌐 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:3000/api
echo 🗄️ Database: postgres://localhost:5432/production_crm
echo.
echo 📋 To view logs: docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f
echo 🛑 To stop: docker-compose -f docker-compose.prod.yml --env-file .env.prod down
echo.
pause
