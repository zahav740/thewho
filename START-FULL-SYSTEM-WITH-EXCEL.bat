@echo off
echo ====================================
echo ПОЛНЫЙ ЗАПУСК CRM С EXCEL IMPORT
echo ====================================
echo.

echo 🔍 Проверка портов...
netstat -an | findstr ":5100 " > nul
if not errorlevel 1 (
    echo ⚠️  Порт 5100 уже занят
    echo Завершаем процесс на порту 5100...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul
)

netstat -an | findstr ":5101 " > nul
if not errorlevel 1 (
    echo ⚠️  Порт 5101 уже занят
    echo Завершаем процесс на порту 5101...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5101 "') do taskkill /F /PID %%a 2>nul
)

echo.
echo 🚀 Запуск Backend (порт 5100)...
cd /d "%~dp0backend"
start "Backend" cmd /k "npm run start:dev"

echo ⏳ Ожидание запуска backend...
timeout /t 10 /nobreak > nul

echo.
echo 🌐 Запуск Frontend (порт 5101)...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm start"

echo ⏳ Ожидание запуска frontend...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Тестирование Excel API...
cd /d "%~dp0"
node scripts\test-excel-endpoints.js

echo.
echo ====================================
echo ✅ СИСТЕМА ЗАПУЩЕНА
echo ====================================
echo 🌐 Frontend: http://localhost:5101
echo 🔧 Backend: http://localhost:5100
echo 📚 API Docs: http://localhost:5100/api/docs
echo 📊 Health: http://localhost:5100/api/health
echo 📁 Excel API: http://localhost:5100/api/excel-import-db
echo ====================================
echo.
echo Для завершения работы закройте все окна терминала
pause
