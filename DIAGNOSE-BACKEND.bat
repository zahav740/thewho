@echo off
echo ===================================
echo   ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ BACKEND
echo ===================================
echo.

cd /d "%~dp0"

echo 1. Проверяем порты...
netstat -an | findstr "5100"
if %errorlevel% equ 0 (
    echo ✅ Порт 5100 занят
) else (
    echo ❌ Порт 5100 свободен - backend не запущен
)

echo.
echo 2. Проверяем PostgreSQL...
netstat -an | findstr "5432"
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL запущен на порту 5432
) else (
    echo ❌ PostgreSQL не запущен
)

echo.
echo 3. Проверяем файлы backend...
if exist "backend\.env" (
    echo ✅ Файл .env существует
) else (
    echo ❌ Файл .env не найден
)

if exist "backend\package.json" (
    echo ✅ Файл package.json существует
) else (
    echo ❌ Файл package.json не найден
)

if exist "backend\node_modules" (
    echo ✅ Зависимости установлены
) else (
    echo ❌ Зависимости не установлены
)

echo.
echo 4. Тестируем подключение к базе данных...
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'thewho',
  user: 'postgres',
  password: 'magarel'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Ошибка подключения к БД:', err.message);
  } else {
    console.log('✅ Подключение к БД успешно');
  }
  pool.end();
});
" 2>nul

echo.
echo ===================================
echo        РЕКОМЕНДАЦИИ
echo ===================================
echo.
echo Если backend не запущен:
echo 1. Запустите: QUICK-START-BACKEND.bat
echo.
echo Если PostgreSQL не запущен:
echo 2. Запустите PostgreSQL сервис
echo 3. Проверьте настройки в backend\.env
echo.
echo Если зависимости не установлены:
echo 4. Запустите: START-BACKEND-5100.bat
echo.
pause
