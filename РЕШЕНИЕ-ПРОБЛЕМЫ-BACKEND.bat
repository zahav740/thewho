@echo off
chcp 65001 > nul
echo.
echo 🔧 РЕШЕНИЕ ПРОБЛЕМЫ: BACKEND НЕ ДОСТУПЕН НА ПОРТУ 5100
echo ================================================
echo.

cd /d "%~dp0"

echo 📋 СИТУАЦИЯ:
echo   ✅ Frontend работает на порту 5101
echo   ❌ Backend недоступен на порту 5100
echo   ❌ Ошибки: net::ERR_CONNECTION_REFUSED
echo.

echo 🔍 ПОШАГОВАЯ ДИАГНОСТИКА...
echo.

echo Шаг 1: Проверяем порты...
netstat -an | find ":5100" > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Порт 5100 занят (что-то работает)
    netstat -ano | find ":5100"
) else (
    echo ❌ Порт 5100 свободен (backend не запущен)
)

echo.
echo Шаг 2: Диагностика backend...
call ДИАГНОСТИКА-BACKEND.bat

echo.
echo Шаг 3: Пробуем запустить backend...
echo 🚀 Запускаем backend в отдельном окне...
start "Backend Debug" cmd /k "cd backend && echo Запуск backend... && npx ts-node --transpile-only src/main.ts"

echo.
echo ⏳ Ждем 10 секунд для запуска...
timeout /t 10 /nobreak

echo.
echo Шаг 4: Проверяем результат...
curl -s http://localhost:5100/api/health > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ УСПЕХ! Backend запущен и отвечает
    echo.
    echo 🌐 Система готова:
    echo   Frontend: http://localhost:5101
    echo   Backend:  http://localhost:5100/api
    echo   Swagger:  http://localhost:5100/api/docs
    echo.
    echo 🎉 Обновите страницу frontend для повторного подключения
) else (
    echo ❌ Backend все еще недоступен
    echo.
    echo 🔧 ВОЗМОЖНЫЕ ПРИЧИНЫ И РЕШЕНИЯ:
    echo.
    echo 1. ОШИБКИ TYPESCRIPT:
    echo    - Запустите: ИСПРАВИТЬ-TYPESCRIPT-ОШИБКИ.bat
    echo    - Затем: ЗАПУСК-BACKEND-ПОРТ-5100.bat
    echo.
    echo 2. ОТСУТСТВУЮЩИЕ ЗАВИСИМОСТИ:
    echo    - cd backend
    echo    - npm install
    echo.
    echo 3. ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ:
    echo    - Проверьте файл .env в папке backend
    echo    - Убедитесь что DB_TYPE=sqlite
    echo.
    echo 4. ПОРТ ЗАНЯТ ДРУГИМ ПРИЛОЖЕНИЕМ:
    echo    - Закройте другие приложения на порту 5100
    echo    - Или измените порт в .env файле
    echo.
    echo 📂 ПРОВЕРЬТЕ ОКНО "Backend Debug" на наличие ошибок!
)

echo.
echo 📋 Если проблема не решена:
echo 1. Скопируйте ошибки из окна "Backend Debug"
echo 2. Запустите: ДИАГНОСТИКА-BACKEND.bat
echo 3. Проверьте логи в backend/logs/
echo.

pause
