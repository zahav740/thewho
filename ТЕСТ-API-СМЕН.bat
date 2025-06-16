@echo off
echo ============================================
echo ТЕСТ API СМЕН И СТАНКОВ
echo ============================================

echo.
echo 1. Проверяем API станков...
echo.
curl -s "http://localhost:5000/api/machines" | echo.

echo.
echo ============================================
echo.

echo 2. Проверяем API смен за сегодня...
echo.
curl -s "http://localhost:5000/api/shifts?startDate=%date:~6,4%-%date:~3,2%-%date:~0,2%&endDate=%date:~6,4%-%date:~3,2%-%date:~0,2%" | echo.

echo.
echo ============================================
echo.

echo 3. Проверяем подключение к базе данных...
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as total_shifts FROM shift_records WHERE DATE(date) = CURRENT_DATE;"

echo.
echo ============================================
echo.

echo 4. Показываем данные смен в базе за сегодня...
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT \"machineId\", \"drawingNumber\", \"dayShiftQuantity\", \"nightShiftQuantity\", (\"dayShiftQuantity\" + \"nightShiftQuantity\") as total FROM shift_records WHERE DATE(date) = CURRENT_DATE ORDER BY \"machineId\";"

echo.
echo ============================================
echo ДИАГНОСТИКА ЗАВЕРШЕНА
echo ============================================
pause
