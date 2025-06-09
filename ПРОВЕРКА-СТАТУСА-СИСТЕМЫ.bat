@echo off
echo ====================================
echo ПРОВЕРКА СТАТУСА CRM СИСТЕМЫ
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
echo [2/4] Проверяем порты...
echo Backend (5100):
netstat -an | find ":5100" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Порт 5100 (Backend) - СЛУШАЕТ
) else (
    echo ❌ Порт 5100 (Backend) - НЕ АКТИВЕН
)

echo Frontend (3000):
netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Порт 3000 (Frontend) - СЛУШАЕТ  
) else (
    echo ❌ Порт 3000 (Frontend) - НЕ АКТИВЕН
)

echo.
echo [3/4] Проверяем доступность API...
echo Тестируем подключение к backend...

curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/health 2>nul | findstr "200" >nul
if %errorlevel% == 0 (
    echo ✅ Backend API отвечает (HTTP 200)
) else (
    echo ❌ Backend API не отвечает или недоступен
    echo Пробуем альтернативный endpoint...
    
    curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/orders 2>nul | findstr "200" >nul
    if %errorlevel% == 0 (
        echo ✅ Backend доступен через /api/orders
    ) else (
        echo ❌ Backend полностью недоступен
    )
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
echo РЕКОМЕНДАЦИИ:
echo ====================================

netstat -an | find ":5100" | find "LISTENING" >nul
if %errorlevel% neq 0 (
    echo 🚨 BACKEND НЕ ЗАПУЩЕН!
    echo 👉 Запустите: ДИАГНОСТИКА-И-ЗАПУСК-BACKEND.bat
    echo.
)

netstat -an | find ":3000" | find "LISTENING" >nul  
if %errorlevel% neq 0 (
    echo 🚨 FRONTEND НЕ ЗАПУЩЕН!
    echo 👉 Запустите: cd frontend && npm start
    echo.
)

curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Система готова к работе!
    echo 📁 Можете загружать Excel файлы
) else (
    echo ⚠️ Система не готова, проверьте backend
)

echo ====================================

pause
