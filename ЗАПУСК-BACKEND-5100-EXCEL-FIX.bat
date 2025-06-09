@echo off
echo ====================================
echo ЗАПУСК BACKEND (ПОРТ 5100) С ИСПРАВЛЕНИЯМИ EXCEL
echo ====================================

echo [1/4] Останавливаем процессы на порту 5100...
netstat -ano | findstr ":5100.*LISTENING" >nul
if %errorlevel% == 0 (
    echo ⚠️ Порт 5100 занят, освобождаем...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5100.*LISTENING"') do (
        echo Завершаем процесс %%i...
        taskkill /f /pid %%i 2>nul
    )
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Порт 5100 свободен
)

echo.
echo [2/4] Переходим в директорию backend...
cd /d "%~dp0\backend"
if not exist package.json (
    echo ❌ Файл package.json не найден!
    echo Проверьте путь к проекту
    pause
    exit /b 1
)
echo ✅ Находимся в директории backend

echo.
echo [3/4] Проверяем зависимости...
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
echo [4/4] Запускаем backend на порту 5100 с исправлениями Excel...
echo.
echo 🔧 ПРИМЕНЕННЫЕ ИСПРАВЛЕНИЯ:
echo   ✅ Убран diskStorage из FileInterceptor  
echo   ✅ Добавлена проверка file.buffer
echo   ✅ Улучшена диагностика Excel файлов
echo   ✅ Показ структуры данных из реальных файлов
echo   ✅ Убраны тестовые данные из API
echo.
echo 🚀 Запускаем сервер на порту 5100...
echo.

rem Запускаем в новом окне с подробным выводом
start "📡 CRM Backend (Port 5100 - Excel Fixed)" cmd /k "title Backend 5100 Excel Fixed && echo BACKEND STARTING ON PORT 5100 WITH EXCEL BUFFER FIX... && npm run start:dev"

echo.
echo ====================================
echo BACKEND ЗАПУСКАЕТСЯ НА ПОРТУ 5100...
echo ====================================
echo 📊 Проверьте новое окно консоли
echo 🌐 Сервер должен запуститься на http://localhost:5100
echo 📋 API будет доступен по адресу http://localhost:5100/api
echo 📁 Теперь можете загружать реальные Excel файлы
echo ====================================

timeout /t 5 /nobreak >nul

echo.
echo Проверяем подключение к серверу...
timeout /t 10 /nobreak >nul

curl -s http://localhost:5100/api/orders >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend успешно запущен на порту 5100!
    echo 🔗 API: http://localhost:5100/api/orders
) else (
    echo ⚠️ Backend еще запускается, подождите немного...
    echo 🔍 Проверьте окно консоли backend для деталей
)

echo.
echo ====================================
echo Готово! Backend запущен с исправлениями Excel
echo Теперь ваши Excel файлы будут обрабатываться корректно
echo ====================================

pause
