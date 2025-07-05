@echo off
echo ======================================
echo БЫСТРЫЙ ЗАПУСК CRM (Порты: 5100/5101)
echo ======================================

set ROOT_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm

echo [1/2] Запуск Backend на порту 5100...
cd /d "%ROOT_DIR%\backend"
start "Backend :5100" cmd /c "cd /d \"%ROOT_DIR%\backend\" && echo Backend запускается на :5100... && npm run start:dev"

echo Ожидание запуска Backend (8 секунд)...
timeout /t 8 /nobreak > nul

echo [2/2] Запуск Frontend на порту 5101...
cd /d "%ROOT_DIR%\frontend"
start "Frontend :5101" cmd /c "cd /d \"%ROOT_DIR%\frontend\" && echo Frontend запускается на :5101... && npm start"

echo.
echo ======================================
echo ✅ СИСТЕМА ЗАПУЩЕНА!
echo ======================================
echo 🔧 Backend:  http://localhost:5100
echo 🌐 Frontend: http://localhost:5101  
echo 📚 API Docs: http://localhost:5100/api/docs
echo 💾 Database: Excel файлы будут сохраняться в БД
echo ======================================
echo.
echo 📋 Для тестирования Excel импорта:
echo 1. Откройте: http://localhost:5101
echo 2. Перейдите в "База данных"
echo 3. Нажмите "🗄️ Excel БД Менеджер"
echo 4. Загрузите Excel файл
echo ======================================

pause
