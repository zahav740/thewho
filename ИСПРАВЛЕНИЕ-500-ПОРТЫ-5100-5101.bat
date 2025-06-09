@echo off
chcp 65001
echo.
echo ===============================================
echo ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ ОШИБКИ 500 - ПОРТЫ 5100/5101
echo ===============================================
echo.

echo 🎯 Исправляем для портов:
echo   - Backend: http://localhost:5100
echo   - Frontend: http://localhost:5101
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
echo 4️⃣ Проверка портов и перезапуск backend:
echo.

echo Останавливаем процессы на портах 5100 и 5101...
netstat -ano | findstr :5100 | findstr LISTENING
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5100') do taskkill /f /pid %%i 2>nul

netstat -ano | findstr :5101 | findstr LISTENING  
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5101') do taskkill /f /pid %%i 2>nul

timeout /t 3 >nul

echo.
echo 🚀 Запускаем backend на порту 5100...
cd backend
start "Backend-5100" cmd /c "npm run start:prod"

echo.
echo ⏳ Ждем запуска backend...
timeout /t 10 >nul

echo.
echo 🧪 Тестируем API на порту 5100:
curl -X GET "http://localhost:5100/api/operators" -H "Content-Type: application/json" 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ API операторов работает на порту 5100
) else (
  echo ❌ API операторов не отвечает на порту 5100
  echo Проверьте логи backend
)

echo.
echo 🎉 Исправление завершено!
echo.
echo 🔗 Проверьте:
echo   - Backend API: http://localhost:5100/api/operators
echo   - Frontend: http://localhost:5101
echo   - Форма смены: выпадающие меню операторов
echo.

pause
