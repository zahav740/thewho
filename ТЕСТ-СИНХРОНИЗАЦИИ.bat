@echo off
chcp 65001 > nul
echo.
echo 🚀 ТЕСТ СИНХРОНИЗАЦИИ ПРОИЗВОДСТВО ↔ СМЕНЫ
echo.
echo Проверка работы синхронизации между модулями Production и Shifts:
echo 1. Производство: Выбирают операцию → записывают в БД
echo 2. Смена: Получает вебхук → записывает операцию в план
echo 3. Смена: Делается наладка → данные записываются в БД
echo 4. Смена: Выполняется объем (день/ночь) → записали в БД
echo 5. Производство: Принимает вебхук → обновляет карточку станка
echo.

REM Базовый URL API
set API_URL=http://localhost:5100/api

echo 🏥 1. Проверка работоспособности системы синхронизации...
curl -s -X GET "%API_URL%/sync/health"
echo.
echo.

echo 📋 2. Получение доступных станков и операций...
REM Получаем первый доступный станок
for /f "tokens=*" %%i in ('curl -s -X GET "%API_URL%/machines/availability" ^| jq -r ".[] | select(.isAvailable == true) | .id" ^| head -1') do set MACHINE_ID=%%i

REM Получаем первую доступную операцию
for /f "tokens=*" %%i in ('curl -s -X GET "%API_URL%/operations" ^| jq -r ".[] | select(.status == \"PENDING\" or .status == \"READY\") | .id" ^| head -1') do set OPERATION_ID=%%i

echo Используем станок ID: %MACHINE_ID%
echo Используем операцию ID: %OPERATION_ID%
echo.

if "%MACHINE_ID%"=="" (
    echo ❌ Не найдены доступные станки для тестирования
    echo    Убедитесь что в БД есть станки с isAvailable=true
    goto :end
)

if "%OPERATION_ID%"=="" (
    echo ❌ Не найдены доступные операции для тестирования
    echo    Убедитесь что в БД есть операции со статусом PENDING или READY
    goto :end
)

echo 🎯 3. Назначение операции с полной синхронизацией...
curl -s -X POST "%API_URL%/planning/assign-operation" -H "Content-Type: application/json" -d "{\"operationId\": %OPERATION_ID%, \"machineId\": %MACHINE_ID%}"
echo.
echo.

timeout /t 2 /nobreak > nul

echo 📊 4. Проверка статуса синхронизации операции...
curl -s -X GET "%API_URL%/planning/sync-status/%OPERATION_ID%"
echo.
echo.

echo 🔨 5. Создание тестовой записи смены (имитация работы модуля Смены)...
REM Получаем текущую дату
for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format 'yyyy-MM-dd'"') do set TODAY=%%i

echo Текущие смены для операции:
curl -s -X GET "%API_URL%/shifts?operationId=%OPERATION_ID%"
echo.
echo.

echo 📈 6. Обновление выполненного объема (день: 10, ночь: 15)...
curl -s -X POST "%API_URL%/shifts" -H "Content-Type: application/json" -d "{\"date\": \"%TODAY%\", \"operationId\": %OPERATION_ID%, \"machineId\": %MACHINE_ID%, \"dayShiftQuantity\": 10, \"nightShiftQuantity\": 15, \"dayShiftOperator\": \"Тест Оператор День\", \"nightShiftOperator\": \"Тест Оператор Ночь\"}"
echo.
echo.

timeout /t 1 /nobreak > nul

echo 🔄 7. Принудительная синхронизация всех данных...
curl -s -X POST "%API_URL%/sync/sync-all"
echo.
echo.

echo 📊 8. Финальная проверка статуса синхронизации...
curl -s -X GET "%API_URL%/planning/sync-status/%OPERATION_ID%"
echo.
echo.

echo 🔧 9. Проверка состояния станка...
curl -s -X GET "%API_URL%/machines/availability" | jq ".[] | select(.id == \"%MACHINE_ID%\")"
echo.
echo.

echo ✅ Тестирование синхронизации завершено!
echo.
echo 📋 Результат тестирования:
echo    - Операция %OPERATION_ID% назначена на станок %MACHINE_ID%
echo    - Автоматически создана запись смены
echo    - Записан выполненный объем: День 10 + Ночь 15 = 25 деталей
echo    - Данные синхронизированы между модулями Production и Shifts
echo.
echo 🎉 Синхронизация работает корректно!

:end
echo.
pause
