@echo off
echo ========================================
echo 📱 ЗАПУСК МОБИЛЬНОЙ ВЕРСИИ CRM
echo ========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 🌐 Определяем сетевую информацию...
node get-network-info.js
echo.

echo ⚠️ ВАЖНО: Убедитесь что backend запущен!
echo.
echo 🚀 Запуск команд для backend:
echo    cd backend
echo    npm start
echo.

echo 📱 Настраиваем мобильную среду...
set HOST=0.0.0.0
set PORT=5101
set REACT_APP_MOBILE=true
set DANGEROUSLY_DISABLE_HOST_CHECK=true

echo.
echo 📋 Мобильные настройки:
echo    HOST=0.0.0.0 (доступ с других устройств)
echo    PORT=5101 (порт frontend)
echo    MOBILE=true (мобильный режим)
echo.

echo 🔧 Проверяем зависимости...
if not exist "node_modules" (
    echo ⬇️ Установка зависимостей...
    npm install
)

echo.
echo 🎉 Запускаем мобильную версию...
echo.
echo ✅ После запуска:
echo    - Frontend будет доступен по http://[IP]:5101
echo    - Откройте этот адрес на мобильном устройстве
echo    - Убедитесь что устройства в одной Wi-Fi сети
echo.
echo ========================================

npm run start-mobile

pause
