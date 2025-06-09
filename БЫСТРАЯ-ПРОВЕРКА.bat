@echo off
echo ========================================
echo БЫСТРАЯ ПРОВЕРКА CRM СИСТЕМЫ (5100-5101)
echo ========================================

echo 🔍 Проверяем порты...
netstat -an | findstr ":5100.*LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Backend на порту 5100 - ЗАПУЩЕН
) else (
    echo ❌ Backend на порту 5100 - НЕ ЗАПУЩЕН
)

netstat -an | findstr ":5101.*LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Frontend на порту 5101 - ЗАПУЩЕН
) else (
    echo ❌ Frontend на порту 5101 - НЕ ЗАПУЩЕН
)

echo.
echo 🌐 Проверяем доступность...
curl -s http://localhost:5100/api/orders >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend API доступен
) else (
    echo ❌ Backend API недоступен
)

curl -s http://localhost:5101 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend доступен
) else (
    echo ❌ Frontend недоступен
)

echo.
echo ========================================
netstat -an | findstr ":5100.*LISTENING" >nul && netstat -an | findstr ":5101.*LISTENING" >nul
if %errorlevel% == 0 (
    echo 🎉 СИСТЕМА ГОТОВА!
    echo 📡 Backend:  http://localhost:5100
    echo 🌐 Frontend: http://localhost:5101
    echo 📁 Можете тестировать Excel импорт
) else (
    echo ⚠️ СИСТЕМА НЕ ГОТОВА
    echo 👉 Запустите: 🚀-ЗАПУСК-CRM-ПОРТЫ-5100-5101.bat
)
echo ========================================

timeout /t 3 /nobreak >nul
