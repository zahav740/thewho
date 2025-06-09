@echo off
echo ====================================
echo ДИАГНОСТИКА И ЗАПУСК BACKEND
echo ====================================

echo [1/5] Проверяем текущие процессы Node.js...
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe"
if %errorlevel% == 0 (
    echo ⚠️ Найдены активные процессы Node.js
    echo Останавливаем их...
    taskkill /f /im node.exe 2>nul
    timeout /t 3 /nobreak >nul
) else (
    echo ✅ Активных процессов Node.js не найдено
)

echo.
echo [2/5] Переходим в директорию backend...
cd /d "%~dp0\backend"
if not exist package.json (
    echo ❌ Файл package.json не найден!
    echo Проверьте путь к проекту
    pause
    exit /b 1
)
echo ✅ Находимся в директории backend

echo.
echo [3/5] Проверяем доступность порта 5100...
netstat -an | find ":5100 " >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️ Порт 5100 занят, пытаемся освободить...
    for /f "tokens=5" %%i in ('netstat -ano ^| find ":5100 "') do (
        echo Завершаем процесс %%i...
        taskkill /f /pid %%i 2>nul
    )
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Порт 5100 свободен
)

echo.
echo [4/5] Проверяем зависимости...
if not exist node_modules (
    echo ⚠️ Папка node_modules не найдена, устанавливаем зависимости...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости установлены
)

echo.
echo [5/5] Запускаем backend с исправлениями buffer...
echo.
echo 🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:
echo   ✅ Убран diskStorage из FileInterceptor  
echo   ✅ Добавлена проверка file.buffer
echo   ✅ Улучшена диагностика Excel файлов
echo   ✅ Убраны тестовые данные из frontend
echo.
echo 🚀 Запускаем сервер на порту 5100...
echo.

rem Запускаем в новом окне с подробным выводом
start "CRM Backend (Fixed Buffer)" cmd /k "echo BACKEND STARTING... && npm run start:dev"

echo.
echo ====================================
echo BACKEND ЗАПУСКАЕТСЯ...
echo ====================================
echo 📊 Проверьте новое окно консоли
echo 🌐 Сервер должен запуститься на http://localhost:5100
echo 📁 Теперь можете загружать реальные Excel файлы
echo ====================================

timeout /t 5 /nobreak >nul

echo.
echo Проверяем подключение к серверу...
timeout /t 10 /nobreak >nul

curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Сервер успешно запущен!
) else (
    echo ⚠️ Сервер еще запускается, подождите немного...
)

echo.
echo ====================================
echo Готово! Можете тестировать Excel импорт
echo ====================================

pause
