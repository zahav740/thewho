@echo off
title Backend Excel Import Server
cd /d "%~dp0backend"

echo ====================================
echo БЫСТРЫЙ ЗАПУСК BACKEND
echo ====================================
echo.

echo 🔄 Копируем настройки разработки...
copy /y .env.development .env

echo 🚀 Запускаем backend на порту 5100...
echo.
echo ✅ Backend запущен!
echo 📋 API: http://localhost:5100/api
echo 📋 Swagger: http://localhost:5100/api/docs
echo 📋 Excel Import: http://localhost:5100/api/excel-import-db
echo.
echo 💡 Теперь можете тестировать Excel импорт в frontend!
echo.

npm run start:dev
