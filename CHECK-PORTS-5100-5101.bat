@echo off
echo ======================================
echo ПРОВЕРКА ПОРТОВ CRM СИСТЕМЫ
echo ======================================

echo Проверка порта 5100 (Backend)...
netstat -an | find "5100" >nul
if %errorlevel% equ 0 (
    echo ✅ Порт 5100 - ЗАНЯТ (Backend должен быть запущен)
) else (
    echo ❌ Порт 5100 - СВОБОДЕН (Backend не запущен)
)

echo.
echo Проверка порта 5101 (Frontend)...
netstat -an | find "5101" >nul
if %errorlevel% equ 0 (
    echo ✅ Порт 5101 - ЗАНЯТ (Frontend должен быть запущен)
) else (
    echo ❌ Порт 5101 - СВОБОДЕН (Frontend не запущен)
)

echo.
echo ======================================
echo ДОСТУПНОСТЬ СЕРВИСОВ
echo ======================================

echo Проверка Backend API...
curl -s -o nul -w "Backend API: HTTP %%{http_code}" http://localhost:5100/api/health
echo.

echo Проверка Frontend...
curl -s -o nul -w "Frontend: HTTP %%{http_code}" http://localhost:5101
echo.

echo.
echo ======================================
echo ПОЛЕЗНЫЕ ССЫЛКИ
echo ======================================
echo 🔧 Backend API:     http://localhost:5100/api
echo 📚 API Docs:        http://localhost:5100/api/docs  
echo 🌐 Frontend App:    http://localhost:5101
echo 📊 Excel Manager:   http://localhost:5101 (База данных → Excel БД Менеджер)
echo ======================================

pause
