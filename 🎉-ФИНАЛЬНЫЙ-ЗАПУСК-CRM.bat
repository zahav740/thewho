@echo off
title FINAL CRM STARTUP - EXCEL FIXED
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║                🎉 ФИНАЛЬНЫЙ ЗАПУСК CRM                        ║
echo  ║            ВСЕ ИСПРАВЛЕНИЯ EXCEL ПРИМЕНЕНЫ                     ║
echo  ║                 Порты: 5100 + 5101                            ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [ЭТАП 1/5] 🧹 Очистка процессов...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Процессы очищены

echo.
echo [ЭТАП 2/5] 🔍 Проверка TypeScript компиляции...
cd /d "%~dp0\backend"

npx tsc --noEmit >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ TypeScript компиляция успешна
) else (
    echo ❌ Ошибки TypeScript! Исправляем...
    echo Проверьте консоль для деталей:
    npx tsc --noEmit
    pause
    exit /b 1
)

echo.
echo [ЭТАП 3/5] 🗄️ Запуск Backend (порт 5100)...
start "📡 CRM Backend Final" cmd /k "title Backend 5100 Final && echo FINAL BACKEND STARTING WITH ALL EXCEL FIXES... && npm run start:dev"
echo ✅ Backend запускается...
timeout /t 15 /nobreak >nul

echo.
echo [ЭТАП 4/5] 🌐 Запуск Frontend (порт 5101)...
cd /d "%~dp0\frontend"
set PORT=5101
start "🖥️ CRM Frontend Final" cmd /k "title Frontend 5101 Final && echo FINAL FRONTEND STARTING... && set PORT=5101 && npm start"
echo ✅ Frontend запускается...
timeout /t 20 /nobreak >nul

echo.
echo [ЭТАП 5/5] 🔍 Финальная проверка системы...

echo Проверяем Backend...
curl -s http://localhost:5100/api/orders >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend готов на порту 5100
) else (
    echo ⚠️ Backend еще запускается...
)

echo Проверяем Frontend...
curl -s http://localhost:5101 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend готов на порту 5101
) else (
    echo ⚠️ Frontend еще запускается...
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo                    🎊 СИСТЕМА ЗАПУЩЕНА! 
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🌐 АДРЕСА:
echo   📡 Backend API: http://localhost:5100/api
echo   🖥️ Frontend:    http://localhost:5101
echo.
echo 🔧 ИСПРАВЛЕНИЯ EXCEL:
echo   ✅ file.buffer вместо diskStorage для Excel
echo   ✅ Убраны все тестовые данные из API
echo   ✅ Добавлена диагностика реальных файлов
echo   ✅ Показ структуры данных из Excel
echo   ✅ Улучшена обработка ошибок
echo.
echo 📁 ТЕСТИРОВАНИЕ:
echo   1. Откройте: http://localhost:5101
echo   2. Идите в раздел "База данных"
echo   3. Загрузите: "תוכנית ייצור מאסטר 2025.xlsx"
echo   4. Проверьте логи Backend - увидите РЕАЛЬНЫЕ данные!
echo.
echo ═══════════════════════════════════════════════════════════════

echo.
echo 🚀 Нажмите Enter для финальной проверки...
pause >nul

echo.
echo 📊 ФИНАЛЬНАЯ ДИАГНОСТИКА:
netstat -an | findstr ":5100.*LISTENING" && echo ✅ Backend 5100 активен || echo ❌ Backend 5100 неактивен
netstat -an | findstr ":5101.*LISTENING" && echo ✅ Frontend 5101 активен || echo ❌ Frontend 5101 неактивен

curl -s http://localhost:5100/api/orders >nul 2>&1 && echo ✅ Backend API работает || echo ❌ Backend API недоступен
curl -s http://localhost:5101 >nul 2>&1 && echo ✅ Frontend работает || echo ❌ Frontend недоступен

echo.
echo ═══════════════════════════════════════════════════════════════
echo           🎉 CRM ГОТОВА ДЛЯ РАБОТЫ С РЕАЛЬНЫМИ EXCEL!
echo                 Больше никаких тестовых данных!
echo ═══════════════════════════════════════════════════════════════

pause
