@echo off
echo ====================================
echo       ЗАПУСК СИСТЕМЫ ЗАКАЗОВ V2
echo ====================================
echo.

echo [1/3] Запуск Backend с модулем Orders V2 на порту 5100...
cd /d "%~dp0backend"
start "Backend Orders V2" cmd /k "npm run start:dev"
timeout /t 5 /nobreak > nul

echo [2/3] Запуск Frontend с новой страницей Заказы на порту 5101...
cd /d "%~dp0frontend"
start "Frontend Orders V2" cmd /k "npm start"
timeout /t 5 /nobreak > nul

echo [3/3] Система запущена!
echo.
echo ====================================
echo           ДОСТУПНЫЕ АДРЕСА
echo ====================================
echo Frontend: http://localhost:5101/orders
echo Backend API: http://localhost:5100/api/v2/orders
echo Backend Swagger: http://localhost:5100/api/docs
echo.
echo ====================================
echo       ТЕСТОВЫЕ ОПЕРАЦИИ
echo ====================================
echo 1. Откройте http://localhost:5101/orders
echo 2. Попробуйте создать новый заказ
echo 3. Загрузите Excel файл для тестирования
echo 4. Проверьте автоматическое распределение приоритетов
echo.
echo Для закрытия всех процессов нажмите Ctrl+C в каждом окне
pause

