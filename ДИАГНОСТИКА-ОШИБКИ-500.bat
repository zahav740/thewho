@echo off
chcp 65001
echo.
echo ===============================================
echo 🩺 ДИАГНОСТИКА ОШИБКИ 500 - ОПЕРАТОРЫ
echo ===============================================
echo.

echo 📋 Проверяем статус системы:
echo.

echo 1️⃣ Проверка портов:
netstat -an | findstr "5100"
netstat -an | findstr "5101"
netstat -an | findstr "3001"

echo.
echo 2️⃣ Проверка таблицы операторов в БД:
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT * FROM operators LIMIT 5;"

echo.
echo 3️⃣ Тестирование API эндпоинтов:
echo.

echo Тестируем основной API:
curl -X GET "http://localhost:5100/api/health" 2>nul || echo "❌ Backend не доступен на 5100"

echo.
echo Тестируем API операторов:
curl -X GET "http://localhost:5100/api/operators" 2>nul || echo "❌ API операторов не доступен"

echo.
echo 4️⃣ Возможные причины ошибки 500:
echo.
echo ❌ Backend не запущен на порту 5100
echo ❌ Таблица operators не создана
echo ❌ Модуль OperatorsModule не подключен к app.module.ts
echo ❌ Ошибка в контроллере операторов
echo ❌ Ошибка подключения к PostgreSQL
echo.

echo 🛠️ Решения:
echo.
echo 1. Создать таблицу: ПРИМЕНИТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.bat
echo 2. Запустить backend: cd backend && npm run start:prod
echo 3. Проверить app.module.ts содержит OperatorsModule
echo 4. Проверить логи backend в консоли
echo.

pause
