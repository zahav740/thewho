@echo off
echo ========================================
echo 🚀 ПОЛНЫЙ ЗАПУСК PRODUCTION CRM
echo ========================================

echo 🔧 1. Запуск Backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
start "Backend" cmd /k "npm run start:dev"

echo ⏳ Ждем 5 секунд для запуска backend...
timeout /t 5 /nobreak > nul

echo 🎨 2. Запуск Frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"  
start "Frontend" cmd /k "npm start"

echo ⏳ Ждем 10 секунд для запуска frontend...
timeout /t 10 /nobreak > nul

echo 🌐 3. Открытие браузера...
start http://localhost:3000

echo.
echo =======================================
echo ✅ ПРИЛОЖЕНИЕ ЗАПУЩЕНО!
echo =======================================
echo 📊 Backend:  http://localhost:5100
echo 🎨 Frontend: http://localhost:3000  
echo 📅 Календарь: http://localhost:3000 (раздел Календарь)
echo.
echo 🎯 Перейдите в раздел "Календарь" для проверки
echo    исправленного производственного календаря
echo.

pause
