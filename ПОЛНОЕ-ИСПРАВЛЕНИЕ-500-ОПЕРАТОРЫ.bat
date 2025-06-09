@echo off
chcp 65001
echo.
echo ===============================================
echo 🚀 ПОЛНОЕ ИСПРАВЛЕНИЕ ОШИБКИ 500 - ОПЕРАТОРЫ
echo ===============================================
echo.

echo Пошаговое исправление проблемы с операторами:
echo.

echo ШАГ 1: Остановка backend процессов
taskkill /f /im node.exe 2>nul || echo "Backend процессы не найдены"
timeout /t 2 >nul

echo.
echo ШАГ 2: Создание таблицы операторов
echo.
psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ-ИСПРАВЛЕНО.sql"

if %ERRORLEVEL% NEQ 0 (
  echo ❌ Ошибка создания таблицы!
  echo.
  echo Возможные проблемы:
  echo  1. PostgreSQL не запущен
  echo  2. База данных 'thewho' не существует
  echo  3. Неправильный пароль для пользователя postgres
  echo.
  echo Попробуйте:
  echo  - Запустить PostgreSQL
  echo  - Проверить пароль: magarel
  echo  - Создать базу данных: CREATE DATABASE thewho;
  echo.
  pause
  exit /b 1
)

echo.
echo ШАГ 3: Проверка созданных операторов
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT name, \"operatorType\" FROM operators WHERE \"isActive\" = true ORDER BY name;"

echo.
echo ШАГ 4: Компиляция и запуск backend
echo.
cd backend

echo 🔄 Очистка старых файлов...
rmdir /s /q dist 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo.
echo 📦 Установка зависимостей...
call npm install

echo.
echo 🔨 Компиляция TypeScript...
call npm run build

echo.
echo 🚀 Запуск backend...
call npm run start:prod

pause
