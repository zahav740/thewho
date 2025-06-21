@echo off
echo ========================================
echo 🔧 ЗАПУСК BACKEND ДЛЯ МОБИЛЬНОГО ДОСТУПА
echo ========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 🌐 Определяем IP-адрес...
node -e "const os = require('os'); const nets = os.networkInterfaces(); for (const name of Object.keys(nets)) { for (const net of nets[name]) { if (net.family === 'IPv4' && !net.internal) { console.log('📍 IP-адрес:', net.address); console.log('🔗 Backend будет доступен:', 'http://' + net.address + ':5100'); } } }"
echo.

echo ⚙️ Настраиваем внешний доступ...
set HOST=0.0.0.0
set PORT=5100
set CORS_ORIGIN=*

echo 📋 Настройки backend:
echo    HOST=0.0.0.0 (доступ с других устройств)
echo    PORT=5100 (стандартный порт)
echo    CORS=* (разрешить все источники)
echo.

echo 🔧 Проверяем зависимости...
if not exist "node_modules" (
    echo ⬇️ Установка зависимостей...
    npm install
)

echo.
echo 🚀 Запускаем backend...
echo.
echo ✅ После запуска backend будет доступен с мобильных устройств
echo ⚠️ Затем запустите ЗАПУСК-МОБИЛЬНОЙ-ВЕРСИИ.bat в другом окне
echo.
echo ========================================

npm start

pause
