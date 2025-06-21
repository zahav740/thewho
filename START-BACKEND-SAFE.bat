@echo off
title Backend Startup - Production CRM
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                🚀 ЗАПУСК BACKEND СЕРВЕРА                ║  
echo ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 📁 Проверяем структуру проекта...
if not exist "backend" (
    echo ❌ ОШИБКА: Папка backend не найдена!
    echo 💡 Убедитесь, что вы в корневой папке production-crm
    pause
    exit /b 1
)

echo ✅ Папка backend найдена
echo.

echo 📂 Переходим в папку backend...
cd backend

echo 📦 Проверяем зависимости Node.js...
if not exist "node_modules" (
    echo 📥 Устанавливаем зависимости...
    echo    Это может занять несколько минут...
    npm install
    
    if errorlevel 1 (
        echo ❌ ОШИБКА: Не удалось установить зависимости
        echo 💡 Проверьте подключение к интернету и версию Node.js
        pause
        exit /b 1
    )
    
    echo ✅ Зависимости установлены
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo 🔧 Проверяем файл окружения (.env)...
if not exist ".env" (
    echo ⚠️  Файл .env не найден, создаем базовый...
    echo PORT=5100 > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_USERNAME=postgres >> .env
    echo DB_PASSWORD=magarel >> .env
    echo DB_NAME=thewho >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Базовый .env создан
) else (
    echo ✅ Файл .env найден
)

echo.
echo 🗄️  Проверяем подключение к базе данных...
echo    База данных: postgresql://postgres:magarel@localhost:5432/thewho
echo    Если база не запущена, backend может не стартовать...
echo.

echo 🚀 Запускаем Backend сервер...
echo.
echo ════════════════════════════════════════════════════════════
echo  🌐 Backend будет доступен на: http://localhost:5100
echo  📚 API документация: http://localhost:5100/api/docs  
echo  🏥 Health check: http://localhost:5100/api/health
echo  📄 PDF endpoint: http://localhost:5100/api/orders/pdf/
echo ════════════════════════════════════════════════════════════
echo.
echo ⚠️  НЕ ЗАКРЫВАЙТЕ ЭТО ОКНО - backend работает здесь!
echo.

npm run start:dev

if errorlevel 1 (
    echo.
    echo ❌ ОШИБКА ЗАПУСКА BACKEND!
    echo.
    echo 🔍 Возможные причины:
    echo    • База данных PostgreSQL не запущена
    echo    • Порт 5100 уже занят
    echo    • Ошибки в коде
    echo    • Проблемы с зависимостями
    echo.
    echo 💡 Решения:
    echo    1. Запустите PostgreSQL
    echo    2. Проверьте свободен ли порт: netstat -an ^| findstr :5100
    echo    3. Проверьте логи выше для деталей ошибки
    echo.
    pause
)
