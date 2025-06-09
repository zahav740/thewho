@echo off
chcp 65001
echo.
echo ===============================================
echo 🔧 НАСТРОЙКА ПОРТОВ ДЛЯ ОПЕРАТОРОВ
echo ===============================================
echo.

echo 📋 Текущая конфигурация:
echo   Frontend: http://localhost:5101 
echo   Backend API: http://localhost:5100/api
echo.

echo 🔍 Проверяем, какие порты заняты:
netstat -an | findstr ":5100"
netstat -an | findstr ":5101"
echo.

echo 📝 Проверяем настройки API в frontend:
findstr "API_BASE_URL\|localhost:5100" "frontend\src\services\api.ts" 2>nul
echo.

echo 🎯 Тестируем подключения:
echo.
echo Тест 1: Проверка здоровья backend API
curl -s http://localhost:5100/api/health 2>nul || echo "❌ Backend API недоступен на порту 5100"

echo.
echo Тест 2: Проверка API операторов  
curl -s http://localhost:5100/api/operators 2>nul && echo "✅ API операторов работает" || echo "❌ API операторов не работает"

echo.
echo 📊 ВОЗМОЖНЫЕ ПРИЧИНЫ ОШИБКИ 500:
echo   1. Backend не запущен на порту 5100
echo   2. Таблица operators не создана в БД
echo   3. Модуль OperatorsModule не подключен
echo   4. Ошибка в SQL запросе операторов
echo.

echo 💡 РЕШЕНИЯ:
echo   1. Запустите: ИСПРАВЛЕНИЕ-ОШИБКИ-500-ОПЕРАТОРЫ.bat
echo   2. Проверьте логи backend в консоли
echo   3. Убедитесь что PostgreSQL запущен
echo.

pause
