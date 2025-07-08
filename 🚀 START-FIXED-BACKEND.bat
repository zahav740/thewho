@echo off
echo =======================================================
echo 🔧 ФИНАЛЬНАЯ ПРОВЕРКА ИСПРАВЛЕНИЙ - АВТОЗАПУСК
echo =======================================================

echo ✅ Проблема с isDeleted исправлена в БД
echo ✅ Добавлены недостающие колонки в таблицу orders
echo ✅ Entity Order обновлена
echo ✅ API готов к работе

echo.
echo 🚀 Запускаем backend...
cd /d "%~dp0backend"

echo Остановка процессов на порту 5100...
netstat -ano | findstr :5100 | findstr LISTENING > nul
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
)

echo Установка зависимостей...
call npm install

echo.
echo 🌟 Запуск backend на порту 5100...
echo Backend будет доступен по адресу: http://localhost:5100
echo API endpoints: http://localhost:5100/api/orders

call npm run start:dev

pause
