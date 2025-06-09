@echo off
chcp 65001
echo.
echo ===============================================
echo 🚨 РЕШЕНИЕ ОШИБКИ 500 - ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ
echo ===============================================
echo.

echo 🎯 Проблема: "Request failed with status code 500"
echo 🎯 Решение: Пошаговое создание таблицы и запуск backend
echo.

echo.
echo 📋 ЭТАП 1: Создание таблицы операторов
echo.
echo Подключаемся к PostgreSQL и создаем таблицу...
psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo ✅ Таблица operators создана успешно
) else (
  echo ❌ ОШИБКА при создании таблицы!
  echo.
  echo Возможные причины:
  echo 1. PostgreSQL не запущен
  echo 2. База данных 'thewho' не существует
  echo 3. Неправильный пароль пользователя postgres
  echo.
  echo Попробуйте:
  echo - Запустить PostgreSQL
  echo - Проверить пароль (magarel)
  echo - Создать базу данных 'thewho'
  echo.
  pause
  exit /b 1
)

echo.
echo 📋 ЭТАП 2: Проверка данных
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT name FROM operators;"

echo.
echo 📋 ЭТАП 3: Остановка предыдущих процессов
echo.
echo Останавливаем все процессы Node.js...
taskkill /f /im node.exe 2>nul
echo Ждем 3 секунды...
timeout /t 3 >nul

echo.
echo 📋 ЭТАП 4: Запуск Backend
echo.
cd backend
echo.
echo Устанавливаем переменные окружения:
set PORT=5100
set NODE_ENV=production

echo.
echo 🚀 Запускаем Backend на порту 5100...
echo После запуска проверьте:
echo - http://localhost:5100/api/health
echo - http://localhost:5100/api/operators/test
echo.

npm run start:prod

echo.
echo 📋 Если ошибка 500 все еще появляется:
echo 1. Проверьте логи backend в консоли
echo 2. Откройте http://localhost:5100/api/operators/test
echo 3. Убедитесь что таблица operators создана
echo 4. Проверьте что OperatorsModule подключен в app.module.ts
echo.

pause
