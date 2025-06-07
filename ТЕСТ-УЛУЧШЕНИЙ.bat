@echo off
echo ================================================
echo ТЕСТ УЛУЧШЕННОГО ПЛАНИРОВАНИЯ
echo ================================================

echo.
echo ✅ НОВЫЕ ВОЗМОЖНОСТИ:
echo [+] Отображение номера чертежа + номера операции
echo [+] Детальная информация при клике на операцию
echo [+] Возможность назначения операции в работу

echo.
echo 1. Компиляция frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo ❌ ОШИБКА: Frontend компиляция!
    pause
    exit /b 1
)

echo.
echo 2. Компиляция backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ ОШИБКА: Backend компиляция!
    pause
    exit /b 1
)

echo.
echo 3. Перезапуск серверов...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo Запуск backend...
start "Backend (УЛУЧШЕННЫЙ)" cmd /k "npm run start:prod"
timeout /t 8

echo Запуск frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
start "Frontend (УЛУЧШЕННЫЙ)" cmd /k "npm start"
timeout /t 8

echo.
echo 4. Тест планирования...
curl -X POST "http://localhost:3001/api/planning/demo" -H "Content-Type: application/json"

echo.
echo.
echo 5. Открытие страницы...
start http://localhost:3000/planning

echo.
echo ================================================
echo 🎯 ТЕСТИРУЙТЕ НОВЫЕ ВОЗМОЖНОСТИ:
echo ================================================
echo.
echo 1. Запустите "Демо планирование"
echo 2. В результатах увидите:
echo    - "Чертеж C6HP0021A - Операция 10" (вместо "Операция #20")
echo    - "Чертеж TH1K4108A - Операция 10" 
echo    - "Чертеж G63828A - Операция 30"
echo.
echo 3. Кликните на любую операцию
echo 4. Откроется модальное окно с:
echo    - Деталями заказа (чертеж, приоритет, срок)
echo    - Деталями операции (тип, время, оси)
echo    - Назначенным станком
echo.
echo 5. Нажмите "Назначить в работу" для назначения
echo.
echo ================================================
pause
