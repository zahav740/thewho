@echo off
echo ====================================
echo   ИСПРАВЛЕНИЕ КОНФИГУРАЦИИ ПОРТОВ
echo ====================================
echo.

echo [1/4] Проверяем backend package.json...
cd /d "%~dp0backend"
if exist package.json (
    echo ✅ Backend package.json найден
    echo 🔧 Проверяем скрипты запуска...
    findstr "start" package.json
) else (
    echo ❌ Backend package.json не найден
)

echo.
echo [2/4] Проверяем frontend package.json...
cd /d "%~dp0frontend"
if exist package.json (
    echo ✅ Frontend package.json найден
    echo 🔧 Проверяем порт по умолчанию...
    if exist .env (
        echo .env файл:
        type .env
    ) else (
        echo 📝 Создаем .env файл с правильным портом...
        echo PORT=5101 > .env
        echo REACT_APP_API_URL=http://localhost:5100/api >> .env
        echo ✅ .env файл создан
    )
) else (
    echo ❌ Frontend package.json не найден
)

echo.
echo [3/4] Проверяем main.ts в backend...
cd /d "%~dp0backend"
if exist src\main.ts (
    echo ✅ main.ts найден
    echo 🔧 Проверяем порт в main.ts...
    findstr "5100\|PORT" src\main.ts
) else (
    echo ❌ main.ts не найден
)

echo.
echo [4/4] Конфигурация завершена!
echo ====================================
echo        ИТОГОВЫЕ НАСТРОЙКИ
echo ====================================
echo Backend: порт 5100 (из переменной PORT или 5100 по умолчанию)
echo Frontend: порт 5101 (из .env файла)
echo API URL: http://localhost:5100/api
echo.
echo Теперь можно запускать систему командой:
echo START-ORDERS-V2.bat
echo.
pause
