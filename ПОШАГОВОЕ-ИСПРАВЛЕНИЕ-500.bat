@echo off
chcp 65001
echo.
echo ===============================================
echo 🆘 ПОШАГОВОЕ ИСПРАВЛЕНИЕ ОШИБКИ 500
echo ===============================================
echo.

echo 🎯 Проблема: Request failed with status code 500
echo 🎯 Причина: Скорее всего таблица operators не создана
echo.

echo 📋 ШАГ 1: Проверяем подключение к PostgreSQL
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT version();"

if %ERRORLEVEL% NEQ 0 (
  echo ❌ Не удается подключиться к PostgreSQL
  echo Проверьте:
  echo - PostgreSQL запущен
  echo - База данных 'thewho' существует
  echo - Логин/пароль правильные
  pause
  exit /b 1
) else (
  echo ✅ PostgreSQL подключение работает
)

echo.
echo 📋 ШАГ 2: Проверяем существование таблицы operators
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'operators';"

echo.
echo 📋 ШАГ 3: Создаем/обновляем таблицу operators
echo.
psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo ✅ Таблица operators готова
) else (
  echo ❌ Ошибка при создании таблицы
  pause
  exit /b 1
)

echo.
echo 📋 ШАГ 4: Проверяем данные в таблице
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total, string_agg(name, ', ') as names FROM operators;"

echo.
echo 📋 ШАГ 5: Останавливаем предыдущие процессы backend
echo.
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo 📋 ШАГ 6: Запускаем Backend на порту 5100
echo.
cd backend
echo Устанавливаем переменную окружения PORT=5100
set PORT=5100
echo Запускаем backend...
npm run start:prod

pause
