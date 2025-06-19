@echo off
echo ==============================================
echo    ЗАПУСК BACKEND ДЛЯ АУТЕНТИФИКАЦИИ
echo ==============================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 🔍 Проверяем файлы backend...
if not exist "package.json" (
    echo ❌ Backend не найден!
    echo 📍 Убедитесь что вы в правильной папке
    pause
    exit /b 1
)

echo 📦 Устанавливаем зависимости backend...
call npm install --silent

echo 🚀 Запускаем backend на порту 5100...
echo.
echo ✅ Backend будет доступен на http://localhost:5100
echo 🔑 Аутентификация должна заработать
echo 💾 База данных: PostgreSQL
echo.
echo 📋 Учетные данные:
echo    Логин: kasuf
echo    Пароль: kasuf123
echo.

call npm run start:dev
