@echo off
echo ====================================
echo ЗАПУСК BACKEND СЕРВЕРА
echo ====================================
echo.

echo Переходим в директорию backend...
cd backend

echo.
echo Проверяем файлы package.json и .env...
if not exist package.json (
    echo ❌ ОШИБКА: package.json не найден!
    pause
    exit /b 1
)

if not exist .env (
    echo ⚠️ ПРЕДУПРЕЖДЕНИЕ: .env файл не найден
)

echo.
echo Установка зависимостей (если нужно)...
call npm install

echo.
echo ====================================
echo ЗАПУСКАЕМ BACKEND НА ПОРТУ 5101
echo ====================================
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

call npm run start:dev

pause
