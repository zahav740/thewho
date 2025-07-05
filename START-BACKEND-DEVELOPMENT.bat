@echo off
echo ====================================
echo ЗАПУСК BACKEND ДЛЯ EXCEL IMPORT
echo ====================================
echo.

cd /d "%~dp0backend"

echo 🔍 Устанавливаем режим разработки...
echo NODE_ENV=development > .env.local
echo PORT=5100 >> .env.local
echo DB_HOST=localhost >> .env.local
echo DB_PORT=5432 >> .env.local
echo DB_NAME=thewho >> .env.local
echo DB_USERNAME=postgres >> .env.local
echo DB_PASSWORD=magarel >> .env.local
echo JWT_SECRET=YourSuperSecretJWTKeyThatIsAtLeast256BitsLong123456789 >> .env.local
echo JWT_EXPIRES_IN=7d >> .env.local
echo CORS_ORIGIN=http://localhost:5101 >> .env.local
echo LOG_LEVEL=debug >> .env.local

echo 🔍 Проверяем соединение с базой данных...
node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'magarel',
  database: 'thewho'
});
client.connect()
  .then(() => {
    console.log('✅ База данных доступна');
    client.end();
  })
  .catch(err => {
    console.log('❌ Ошибка подключения к БД:', err.message);
    process.exit(1);
  });
"

if errorlevel 1 (
    echo.
    echo ❌ База данных недоступна!
    echo 💡 Проверьте:
    echo    - Запущен ли PostgreSQL
    echo    - Существует ли база данных 'thewho'
    echo    - Правильные ли учетные данные (postgres/magarel)
    pause
    exit /b 1
)

echo.
echo 🚀 Запуск backend с настройками разработки...
echo 📋 Порт: 5100
echo 📋 Режим: Development
echo 📋 База данных: PostgreSQL (localhost:5432/thewho)
echo 📋 CORS: http://localhost:5101
echo.

set NODE_ENV=development
npm run start:dev

pause
