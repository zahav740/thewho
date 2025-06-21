@echo off
echo ==========================================
echo 🏠 ЗАПУСК ЛОКАЛЬНОЙ РАЗРАБОТКИ
echo ==========================================
echo Backend: http://localhost:5100
echo Frontend: http://localhost:5101
echo ==========================================

echo 📋 Настройка окружения для локальной разработки...

REM Копирование правильных .env файлов для локальной разработки
echo Настройка Backend (порт 5100)...
copy backend\.env.development backend\.env

echo Настройка Frontend (порт 5101)...
copy frontend\.env.development frontend\.env.local

echo ✅ Окружение настроено для локальной разработки!
echo.
echo 🚀 Запуск Backend...
cd backend
start "Backend (5100)" cmd /k "npm run start:dev"

echo Ждем 3 секунды...
timeout /t 3 /nobreak >nul

echo 🚀 Запуск Frontend...
cd ..\frontend
start "Frontend (5101)" cmd /k "npm start"

cd ..

echo.
echo ==========================================
echo ✅ ЛОКАЛЬНАЯ РАЗРАБОТКА ЗАПУЩЕНА!
echo ==========================================
echo 🌐 Доступ:
echo   Frontend: http://localhost:5101
echo   Backend:  http://localhost:5100
echo   API:      http://localhost:5100/api
echo.
echo 📋 Активные порты:
echo   Backend:  5100 (локальная PostgreSQL)
echo   Frontend: 5101
echo.
echo 🔧 Для остановки закройте окна или нажмите Ctrl+C
echo ==========================================