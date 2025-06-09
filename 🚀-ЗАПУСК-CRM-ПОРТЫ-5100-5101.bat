@echo off
title CRM System Startup (Ports 5100-5101)
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                    🚀 CRM СИСТЕМА ЗАПУСК                      ║
echo  ║                 Порты: 5100 (Backend) + 5101 (Frontend)       ║
echo  ║                  (С исправлениями Excel buffer)               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [ЭТАП 1/4] 🧹 Очистка старых процессов на портах 5100-5101...
netstat -ano | findstr ":5100 " | findstr "LISTENING"
if %errorlevel% == 0 (
    echo Освобождаем порт 5100...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5100 " ^| findstr "LISTENING"') do taskkill /f /pid %%i 2>nul
)

netstat -ano | findstr ":5101 " | findstr "LISTENING"
if %errorlevel% == 0 (
    echo Освобождаем порт 5101...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5101 " ^| findstr "LISTENING"') do taskkill /f /pid %%i 2>nul
)

taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul
echo ✅ Процессы очищены

echo.
echo [ЭТАП 2/4] 🗄️ Запуск Backend сервера на порту 5100...
cd /d "%~dp0\backend"
if not exist package.json (
    echo ❌ Backend не найден! Проверьте структуру проекта
    pause
    exit /b 1
)

echo Запускаем backend на порту 5100...
start "📡 CRM Backend (Port 5100 - Fixed Excel)" cmd /k "title Backend Server 5100 && echo BACKEND STARTING ON PORT 5100 WITH EXCEL FIX... && npm run start:dev"

echo ✅ Backend запускается на порту 5100...
echo Ожидаем готовности сервера...
timeout /t 15 /nobreak >nul

echo.
echo [ЭТАП 3/4] 🌐 Запуск Frontend приложения на порту 5101...
cd /d "%~dp0\frontend"
if not exist package.json (
    echo ❌ Frontend не найден! Проверьте структуру проекта
    pause
    exit /b 1
)

echo Запускаем frontend на порту 5101...
set PORT=5101
start "🖥️ CRM Frontend (Port 5101)" cmd /k "title Frontend App 5101 && echo FRONTEND STARTING ON PORT 5101... && set PORT=5101 && npm start"

echo ✅ Frontend запускается на порту 5101...

echo.
echo [ЭТАП 4/4] 🔍 Проверка готовности системы...
echo Ожидаем полного запуска серверов...
timeout /t 20 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════════
echo                        🎉 ЗАПУСК ЗАВЕРШЕН
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📡 Backend:  http://localhost:5100
echo 🌐 Frontend: http://localhost:5101
echo.
echo 🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:
echo   ✅ Убран diskStorage - файлы обрабатываются в памяти
echo   ✅ Исправлен file.buffer для Excel импорта
echo   ✅ Убраны тестовые данные из API
echo   ✅ Добавлена диагностика реальных файлов
echo.
echo 📁 ТЕСТИРОВАНИЕ:
echo   1. Откройте http://localhost:5101
echo   2. Перейдите в раздел "База данных"
echo   3. Загрузите ваш Excel файл "תוכנית ייצור מאסטר 2025.xlsx"
echo   4. Проверьте логи в консоли Backend (порт 5100)
echo.
echo ═══════════════════════════════════════════════════════════════

echo.
echo Нажмите любую клавишу для проверки статуса системы...
pause >nul

echo.
echo 🔍 Проверяем доступность серверов...

echo Backend (5100):
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend отвечает на порту 5100
) else (
    echo ⚠️ Backend еще запускается или недоступен на порту 5100
    echo Проверяем альтернативный endpoint...
    curl -s http://localhost:5100/api/orders >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Backend доступен через /api/orders
    )
)

echo Frontend (5101):
curl -s http://localhost:5101 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend отвечает на порту 5101
) else (
    echo ⚠️ Frontend еще запускается или недоступен на порту 5101
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo                     🚀 СИСТЕМА ГОТОВА!
echo              Backend: 5100 | Frontend: 5101
echo                  Можете тестировать Excel импорт
echo ═══════════════════════════════════════════════════════════════

pause
