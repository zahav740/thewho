@echo off
title Production CRM - Registration Testing
color 0A

echo ========================================
echo 🎯 Production CRM - Registration Testing
echo ========================================
echo.

echo 📋 Этот скрипт поможет протестировать новую систему регистрации
echo.

echo 🔧 Что нужно сделать:
echo 1. Убедиться что PostgreSQL запущен
echo 2. Запустить Backend (порт 5100)
echo 3. Запустить Frontend (порт 3000)
echo 4. Протестировать регистрацию
echo.

echo ⚡ Быстрые команды:
echo.

echo 📁 Запуск Backend:
echo cd backend
echo npm run start:dev
echo.

echo 📁 Запуск Frontend:
echo cd frontend  
echo npm start
echo.

echo 🌐 Тестовые URL:
echo - Frontend: http://localhost:3000
echo - Login: http://localhost:3000/login
echo - Register: http://localhost:3000/register
echo - API Docs: http://localhost:5100/api/docs
echo.

echo 👤 Тестовые данные для входа:
echo - Admin: kasuf / kasuf123
echo - Test User: test / (пароль неизвестен, используйте регистрацию)
echo.

echo 🧪 Для тестирования API:
echo - Откройте API-REGISTRATION-TESTS.md
echo - Используйте Postman или cURL команды
echo.

echo 📊 Для проверки базы данных:
echo - Откройте TEST-REGISTRATION-QUERIES.sql
echo - Выполните SQL запросы в pgAdmin или другом клиенте
echo.

echo ========================================
echo 💡 Полная документация в файле:
echo REGISTRATION-SYSTEM-READY.md
echo ========================================
echo.

pause
