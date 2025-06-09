@echo off
echo ====================================
echo ПРОВЕРКА СТАТУСА CRM (ПОРТЫ 5100-5101)
echo ====================================

echo [1/4] Проверяем процессы Node.js...
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if %errorlevel% == 0 (
    echo ✅ Node.js процессы запущены:
    tasklist /fi "imagename eq node.exe" | findstr node.exe
) else (
    echo ❌ Node.js процессы не найдены
)

echo.
echo [2/4] Проверяем ваши порты 5100-5101...
echo Backend (5100):
netstat -an | find ":5100" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Порт 5100 (Backend) - СЛУШАЕТ
    netstat -an | find ":5100" | find "LISTENING"
) else (
    echo ❌ Порт 5100 (Backend) - НЕ АКТИВЕН
)

echo Frontend (5101):
netstat -an | find ":5101" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Порт 5101 (Frontend) - СЛУШАЕТ  
    netstat -an | find ":5101" | find "LISTENING"
) else (
    echo ❌ Порт 5101 (Frontend) - НЕ АКТИВЕН
)

echo.
echo [3/4] Проверяем доступность API на ваших портах...
echo Тестируем Backend на порту 5100...

curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/health 2>nul | findstr "200" >nul
if %errorlevel% == 0 (
    echo ✅ Backend API отвечает на 5100 (HTTP 200)
) else (
    echo ❌ Backend API не отвечает на 5100
    echo Пробуем альтернативные endpoints...
    
    curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/orders 2>nul | findstr "200" >nul
    if %errorlevel% == 0 (
        echo ✅ Backend доступен через /api/orders на 5100
    ) else (
        curl -s -o nul -w "%%{http_code}" http://localhost:5100/ 2>nul | findstr "200\|404" >nul
        if %errorlevel% == 0 (
            echo ✅ Backend запущен на 5100 (но API может быть недоступен)
        ) else (
            echo ❌ Backend полностью недоступен на 5100
        )
    )
)

echo Тестируем Frontend на порту 5101...
curl -s -o nul -w "%%{http_code}" http://localhost:5101 2>nul | findstr "200" >nul
if %errorlevel% == 0 (
    echo ✅ Frontend отвечает на 5101 (HTTP 200)
) else (
    echo ❌ Frontend не отвечает на 5101
)

echo.
echo [4/4] Проверяем файлы проекта...
if exist "backend\package.json" (
    echo ✅ Backend структура найдена
) else (
    echo ❌ Backend структура не найдена
)

if exist "frontend\package.json" (
    echo ✅ Frontend структура найдена  
) else (
    echo ❌ Frontend структура не найдена
)

echo.
echo ====================================
echo РЕКОМЕНДАЦИИ ДЛЯ ПОРТОВ 5100-5101:
echo ====================================

netstat -an | find ":5100" | find "LISTENING" >nul
if %errorlevel% neq 0 (
    echo 🚨 BACKEND НЕ ЗАПУЩЕН НА ПОРТУ 5100!
    echo 👉 Запустите: 🚀-ЗАПУСК-CRM-ПОРТЫ-5100-5101.bat
    echo.
)

netstat -an | find ":5101" | find "LISTENING" >nul  
if %errorlevel% neq 0 (
    echo 🚨 FRONTEND НЕ ЗАПУЩЕН НА ПОРТУ 5101!
    echo 👉 Запустите: cd frontend && set PORT=5101 && npm start
    echo.
)

curl -s http://localhost:5100/api/orders >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Система готова к работе на портах 5100-5101!
    echo 📁 Можете загружать Excel файлы через http://localhost:5101
) else (
    echo ⚠️ Система не готова, проверьте backend на порту 5100
)

echo.
echo 📋 URL для тестирования:
echo   Backend API: http://localhost:5100/api/orders
echo   Frontend:    http://localhost:5101
echo ====================================

pause
