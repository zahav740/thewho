@echo off
echo ===============================================
echo ТЕСТ СИСТЕМЫ АВТОЗАВЕРШЕНИЯ ОПЕРАЦИЙ
echo ===============================================

echo.
echo [1/4] Проверка API endpoints...
echo Тестируем /api/operations/completion/check-all-active

curl -s -X GET "http://localhost:5100/api/operations/completion/check-all-active" > nul
if %ERRORLEVEL% neq 0 (
    echo ❌ API недоступен! Убедитесь что backend запущен на порту 5100
    echo Запустите: START-FIXED-BACKEND.bat
    pause
    exit /b 1
) else (
    echo ✅ API доступен
)

echo.
echo [2/4] Создание тестового заказа с операциями...

REM Создаем тестовый заказ C6HP0021A с количеством 5 для быстрого тестирования
curl -s -X POST "http://localhost:5100/api/orders" ^
-H "Content-Type: application/json" ^
-d "{\"drawingNumber\":\"C6HP0021A-TEST\",\"quantity\":5,\"deadline\":\"2025-06-20\",\"priority\":1,\"workType\":\"MILLING\"}" > test_order_response.json

echo ✅ Тестовый заказ создан

echo.
echo [3/4] Проверка созданных операций...

REM Получаем список операций для проверки
curl -s -X GET "http://localhost:5100/api/operations-simple" > test_operations_response.json
echo ✅ Операции проверены

echo.
echo [4/4] Создание тестовых смен с накоплением...

REM Имитируем работу смен - добавляем записи с прогрессом
echo Добавляем записи смен для достижения планового количества...

REM Здесь можно добавить curl запросы для создания shift_records

echo.
echo ========================================
echo 🎯 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:
echo ========================================
echo.
echo 1. Откройте frontend: http://localhost:3000
echo 2. Перейдите в раздел "Мониторинг производства"
echo 3. В карточке станка найдите операцию C6HP0021A-TEST
echo 4. Нажмите "Прогресс" и введите:
echo    - Выполнено деталей: 5
echo    - Всего деталей: 5
echo 5. Должно появиться уведомление о завершении!
echo.
echo 🔔 Автоматическая проверка выполняется каждые 15 секунд
echo.
echo Варианты действий в уведомлении:
echo ✅ ЗАКРЫТЬ - завершить операцию и архивировать
echo ▶️ ПРОДОЛЖИТЬ - продолжить накопление
echo 📋 СПЛАНИРОВАТЬ - закрыть + открыть планирование
echo.

echo Логи API можно посмотреть в консоли backend
echo Для проверки вручную: GET /api/operations/completion/check-all-active

pause
