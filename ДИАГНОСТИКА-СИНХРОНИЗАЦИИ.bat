@echo off
chcp 65001 > nul

echo 🔍 ДИАГНОСТИКА ПРОБЛЕМЫ СИНХРОНИЗАЦИИ
echo.

set API_URL=http://localhost:5100/api

echo 1. Получение данных станков...
curl -s "%API_URL%/machines/status/all" > machines.json
echo Данные станков сохранены в machines.json

echo.
echo 2. Получение данных смен...
curl -s "%API_URL%/shifts" > shifts.json
echo Данные смен сохранены в shifts.json

echo.
echo 3. Анализ смены 29...
echo Проверьте файл shifts.json для смены с id: 29

echo.
echo 4. Анализ станка Doosan 3...
echo Проверьте файл machines.json для станка с id: 3

echo.
echo 🎯 ИНСТРУКЦИЯ:
echo    1. Откройте shifts.json и найдите смену с id: 29
echo    2. Проверьте поля: machineId, drawingNumber, orderDrawingNumber
echo    3. Откройте machines.json и найдите станок с id: 3
echo    4. Проверьте поле: currentOperationDetails.orderDrawingNumber
echo    5. Сравните значения вручную
echo.
echo Если данные должны совпадать, но алгоритм не работает,
echo то проблема в коде фронтенда (MachineCard.tsx)

pause
