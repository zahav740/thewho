@echo off
echo 🚀 Перезапуск backend с новыми модулями...

echo 📦 Установка зависимостей...
cd backend
call npm install

echo 🔧 Применение миграции soft delete...
if exist .env (
    echo 📋 Найден файл .env
) else (
    echo ⚠️ Файл .env не найден, используем значения по умолчанию
)

echo 🗃️ Применяем миграцию к БД...
REM Если у вас настроена БД PostgreSQL, раскомментируйте строку ниже:
REM psql -h localhost -p 5432 -U postgres -d thewho_db -f "src/database/migrations/add-soft-delete-to-orders.sql"

echo 🔨 Компиляция TypeScript...
call npm run build

echo 🚀 Запуск сервера в режиме разработки...
call npm run start:dev

pause
