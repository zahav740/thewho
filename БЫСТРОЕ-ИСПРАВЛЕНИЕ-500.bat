@echo off
chcp 65001
echo.
echo ===============================================
echo ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ 500 - ОПЕРАТОРЫ
echo ===============================================
echo.

echo 🎯 Применяем быстрое исправление...
echo.

echo 1️⃣ Создание таблицы операторов:
psql -h localhost -p 5432 -U postgres -d thewho -c "DROP TABLE IF EXISTS operators CASCADE;"
psql -h localhost -p 5432 -U postgres -d thewho -c "CREATE TABLE operators (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, \"isActive\" BOOLEAN DEFAULT true, \"operatorType\" VARCHAR(50) DEFAULT 'BOTH', \"createdAt\" TIMESTAMP DEFAULT NOW(), \"updatedAt\" TIMESTAMP DEFAULT NOW());"

echo.
echo 2️⃣ Добавление операторов:
psql -h localhost -p 5432 -U postgres -d thewho -c "INSERT INTO operators (name, \"operatorType\") VALUES ('Denis', 'BOTH'), ('Andrey', 'BOTH'), ('Daniel', 'BOTH'), ('Slava', 'BOTH'), ('Kirill', 'BOTH'), ('Аркадий', 'PRODUCTION') ON CONFLICT (name) DO NOTHING;"

echo.
echo 3️⃣ Проверка:
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_operators FROM operators;"

echo.
echo ✅ Таблица операторов готова!
echo.
echo 4️⃣ Перезапуск backend:
echo.

cd backend
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul
start "Backend" cmd /c "npm run start:prod"

echo.
echo 🎉 Backend перезапущен!
echo.
echo 🔗 Проверьте:
echo   - http://localhost:3001/api/operators
echo   - Frontend на http://localhost:5101
echo.

pause
