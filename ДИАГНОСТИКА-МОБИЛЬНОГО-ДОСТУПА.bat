@echo off
echo ========================================
echo 🔍 ДИАГНОСТИКА МОБИЛЬНОГО ДОСТУПА
echo ========================================
echo.

echo 📍 1. ОПРЕДЕЛЕНИЕ IP-АДРЕСА
echo.
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do (
    echo Найден IPv4: %%i
)
echo.

echo 🌐 2. ПРОВЕРКА СЕТЕВЫХ ИНТЕРФЕЙСОВ
echo.
ipconfig | findstr /c:"Wireless" /c:"Ethernet" /c:"IPv4"
echo.

echo 🔧 3. ПРОВЕРКА ПОРТОВ
echo.
echo Проверяем порт 5100 (backend):
netstat -an | findstr :5100
echo.
echo Проверяем порт 5101 (frontend):
netstat -an | findstr :5101
echo.

echo 🛡️ 4. ПРОВЕРКА FIREWALL
echo.
echo Состояние Windows Firewall:
netsh advfirewall show allprofiles state
echo.

echo 📱 5. ТЕСТ ДОСТУПНОСТИ
echo.
echo Тестируем localhost backend:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5100/api/health 2>nul || echo "Backend недоступен на localhost:5100"

echo.
echo Тестируем localhost frontend:  
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5101 2>nul || echo "Frontend недоступен на localhost:5101"

echo.
echo 📋 6. ИНСТРУКЦИИ ДЛЯ МОБИЛЬНОГО ДОСТУПА
echo.
echo 1. Убедитесь что backend запущен: ЗАПУСК-BACKEND-ДЛЯ-МОБИЛЬНЫХ.bat
echo 2. Запустите frontend: ЗАПУСК-МОБИЛЬНОЙ-ВЕРСИИ.bat  
echo 3. Используйте IP-адрес выше для доступа с мобильного
echo 4. Формат: http://[IP]:5101
echo.

echo 🔧 7. РЕШЕНИЕ ПРОБЛЕМ
echo.
echo Если backend недоступен:
echo - Запустите ЗАПУСК-BACKEND-ДЛЯ-МОБИЛЬНЫХ.bat
echo - Проверьте что порт 5100 свободен
echo.
echo Если frontend недоступен:
echo - Запустите ЗАПУСК-МОБИЛЬНОЙ-ВЕРСИИ.bat
echo - Проверьте что порт 5101 свободен
echo.
echo Если firewall блокирует:
echo - Откройте "Брандмауэр Windows" 
echo - Разрешите Node.js для частных сетей
echo.

echo ========================================
echo ✅ Диагностика завершена
echo ========================================

pause
