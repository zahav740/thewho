@echo off
title CRM System Startup
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                    🚀 CRM СИСТЕМА ЗАПУСК                      ║
echo  ║                  (С исправлениями Excel buffer)               ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [ЭТАП 1/4] 🧹 Очистка старых процессов...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Процессы очищены

echo.
echo [ЭТАП 2/4] 🗄️ Запуск Backend сервера...
cd /d "%~dp0\backend"
if not exist package.json (
    echo ❌ Backend не найден! Проверьте структуру проекта
    pause
    exit /b 1
)

echo Запускаем backend на порту 5100...
start "📡 CRM Backend Server (Fixed Excel)" cmd /k "title Backend Server && echo BACKEND STARTING WITH EXCEL FIX... && npm run start:dev"

echo ✅ Backend запускается...
echo Ожидаем готовности сервера...
timeout /t 15 /nobreak >nul

echo.
echo [ЭТАП 3/4] 🌐 Запуск Frontend приложения...
cd /d "%~dp0\frontend"
if not exist package.json (
    echo ❌ Frontend не найден! Проверьте структуру проекта
    pause
    exit /b 1
)

echo Запускаем frontend на порту 3000...
start "🖥️ CRM Frontend App" cmd /k "title Frontend App && echo FRONTEND STARTING... && npm start"

echo ✅ Frontend запускается...

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
echo 🌐 Frontend: http://localhost:3000  
echo.
echo 🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:
echo   ✅ Убран diskStorage - файлы обрабатываются в памяти
echo   ✅ Исправлен file.buffer для Excel импорта
echo   ✅ Убраны тестовые данные из API
echo   ✅ Добавлена диагностика реальных файлов
echo.
echo 📁 ТЕСТИРОВАНИЕ:
echo   1. Откройте http://localhost:3000
echo   2. Перейдите в раздел "База данных"
echo   3. Загрузите ваш Excel файл "תוכנית ייצור מאסטר 2025.xlsx"
echo   4. Проверьте логи в консоли Backend
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
    echo ✅ Backend отвечает
) else (
    echo ⚠️ Backend еще запускается или недоступен
)

echo Frontend (3000):
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend отвечает
) else (
    echo ⚠️ Frontend еще запускается или недоступен
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo                     🚀 СИСТЕМА ГОТОВА!
echo                  Можете тестировать Excel импорт
echo ═══════════════════════════════════════════════════════════════

pause
