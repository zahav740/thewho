@echo off
chcp 65001
echo.
echo ===============================================
echo 🔍 ДИАГНОСТИКА ОШИБКИ 500 - ОПЕРАТОРЫ
echo ===============================================
echo.

echo 📋 Проверяем статус системы...
echo.

echo 1️⃣ Проверка портов:
netstat -an | findstr ":5100"
netstat -an | findstr ":5101"
echo.

echo 2️⃣ Проверка Backend API:
echo Тестируем базовые endpoints...
curl -s http://localhost:5100/api/health 2>nul || echo "❌ Backend не отвечает на порту 5100"
curl -s http://localhost:5101/api/health 2>nul || echo "❌ Backend не отвечает на порту 5101"
echo.

echo 3️⃣ Проверка таблицы операторов в БД:
echo Подключаемся к PostgreSQL...
psql -h localhost -p 5432 -U postgres -d thewho -c "\dt operators" 2>nul || echo "❌ Таблица operators не найдена"
echo.

echo 4️⃣ Проверка API операторов:
echo Тестируем GET /api/operators...
curl -s http://localhost:5100/api/operators 2>nul || echo "❌ API операторов недоступно на 5100"
curl -s http://localhost:5101/api/operators 2>nul || echo "❌ API операторов недоступно на 5101"
echo.

echo 📊 РЕЗУЛЬТАТЫ:
echo - Если Backend не запущен: запустите УСТАНОВКА-ОПЕРАТОРОВ-ПОЛНАЯ.bat
echo - Если таблица не создана: запустите ПРИМЕНИТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.bat  
echo - Если API не работает: проверьте логи backend
echo.

pause
