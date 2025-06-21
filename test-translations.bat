@echo off
echo 🚀 Запуск фронтенда для тестирования переводов...
echo 📍 Директория: production-crm\frontend

cd frontend

echo 📦 Установка зависимостей (если необходимо)...
call npm install --silent

echo 🔧 Настройка переменных окружения...
if not exist .env (
    echo REACT_APP_API_URL=http://localhost:5100 > .env
    echo PORT=5101 >> .env
    echo ✅ Создан файл .env
)

echo.
echo 🌐 Запуск React сервера на порту 5101...
echo 📋 После запуска проверьте:
echo    1. Откройте http://localhost:5101
echo    2. Перейдите на страницу Производство
echo    3. Проверьте, что названия станков отображаются правильно
echo    4. Переключите язык и проверьте переводы
echo.

call npm start
