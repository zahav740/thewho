@echo off
chcp 65001
echo.
echo ===============================================
echo 🔧 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ОШИБКИ 500
echo ===============================================
echo.

echo 📋 ЭТАП 1: Создание таблицы операторов
echo.

echo Применяем SQL скрипт к базе данных...
psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo ✅ Таблица операторов создана/обновлена
) else (
  echo ❌ Ошибка при создании таблицы
  echo Проверьте:
  echo - PostgreSQL запущен
  echo - База данных 'thewho' существует
  echo - Пользователь postgres имеет права доступа
  pause
  exit /b 1
)

echo.
echo 📋 ЭТАП 2: Проверка таблицы
echo.

psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as operator_count FROM operators;"

echo.
echo 📋 ЭТАП 3: Запуск Backend на порту 5100
echo.

echo 🚀 Запускаем Backend...
cd backend

echo Останавливаем предыдущие процессы...
taskkill /f /im node.exe 2>nul

echo Запускаем на правильном порту...
set PORT=5100
npm run start:prod

pause
