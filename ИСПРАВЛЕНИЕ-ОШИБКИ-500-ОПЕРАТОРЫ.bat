@echo off
chcp 65001
echo.
echo ========================================================
echo 🛠️ ИСПРАВЛЕНИЕ ОШИБКИ 500 - ОПЕРАТОРЫ (ПОЛНОЕ)
echo ========================================================
echo.

echo 📋 ЭТАП 1: Проверка и создание таблицы операторов
echo.
psql -h localhost -p 5432 -U postgres -d thewho -f "ПРОВЕРКА-И-СОЗДАНИЕ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo ✅ База данных готова!
) else (
  echo ❌ Ошибка подключения к БД!
  echo Проверьте, что PostgreSQL запущен
  pause
  exit /b 1
)

echo.
echo 📋 ЭТАП 2: Остановка существующих процессов
echo.
echo Останавливаем процессы на портах 5100 и 5101...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5100" ^| findstr "LISTENING"') do (
  echo Останавливаем процесс %%a на порту 5100
  taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5101" ^| findstr "LISTENING"') do (
  echo Останавливаем процесс %%a на порту 5101  
  taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 📋 ЭТАП 3: Запуск Backend с модулем операторов
echo.
cd backend

echo Устанавливаем зависимости...
call npm install >nul 2>&1

echo.
echo 🚀 Запускаем Backend на порту 5100...
set NODE_ENV=production
set PORT=5100
call npm run start:prod

pause
