@echo off
echo ================================================
echo 🏭 ПРОДАКШЕН ВЕРСИЯ ПЛАНИРОВАНИЯ
echo ================================================

echo.
echo ✅ ПРОДАКШЕН ИСПРАВЛЕНИЯ:
echo [✓] Убраны все тестовые данные
echo [✓] Все данные из реальной БД
echo [✓] Реальный API назначения операций  
echo [✓] Обновление статусов станков и операций
echo [✓] Продакшен логирование

echo.
echo 1. Компиляция backend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ ОШИБКА: Backend компиляция!
    pause
    exit /b 1
)

echo.
echo 2. Компиляция frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo ❌ ОШИБКА: Frontend компиляция!
    pause
    exit /b 1
)

echo.
echo 3. Перезапуск продакшен серверов...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo Запуск backend (ПРОДАКШЕН)...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
start "Backend PROD" cmd /k "npm run start:prod"
timeout /t 8

echo Запуск frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"
start "Frontend PROD" cmd /k "npm start"
timeout /t 8

echo.
echo 4. Тест продакшен API...
echo.
echo === Планирование с реальными данными ===
curl -X POST "http://localhost:3001/api/planning/demo" -H "Content-Type: application/json"

echo.
echo.
echo 5. Открытие продакшен интерфейса...
start http://localhost:3000/planning

echo.
echo ================================================
echo 🎯 ПРОДАКШЕН ФУНКЦИОНАЛ:
echo ================================================
echo.
echo 1. ПЛАНИРОВАНИЕ:
echo    - Использует реальные заказы из БД
echo    - Реальные операции и станки
echo    - Актуальные статусы станков
echo.
echo 2. НАЗНАЧЕНИЕ ОПЕРАЦИЙ:
echo    - Реальное обновление БД
echo    - Станок становится занятым (isOccupied=true)
echo    - Операция получает статус "assigned"
echo    - Проверка доступности станка
echo.
echo 3. ОТОБРАЖЕНИЕ:
echo    - Номер чертежа + номер операции
echo    - Детальная информация из БД
echo    - Реальные данные о заказах и операциях
echo.
echo ================================================
echo 🔍 ПРОВЕРЬТЕ В ИНТЕРФЕЙСЕ:
echo ================================================
echo.
echo 1. Запустите планирование
echo 2. Кликните на операцию - откроется реальная информация
echo 3. Нажмите "Назначить в работу"
echo 4. Проверьте в БД что станок стал занятым
echo 5. Операция получила assignedMachine и статус
echo.
echo ================================================
pause
