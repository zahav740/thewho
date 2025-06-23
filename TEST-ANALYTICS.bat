@echo off
echo ====================================
echo ТЕСТИРОВАНИЕ АНАЛИТИКИ ОПЕРАЦИЙ
echo ====================================
echo.

echo Тестирование аналитики для станка ID=7 (Doosan Yashana):
curl -s "http://localhost:5100/api/operation-analytics/machine/7" > analytics_test.json

echo.
echo Результат сохранен в analytics_test.json
echo Проверяем содержимое:
type analytics_test.json

echo.
echo ====================================
echo Тестирование других станков:
echo.

for %%i in (1,2,3,4,5,6,7,8) do (
    echo Станок %%i:
    curl -s "http://localhost:5100/api/operation-analytics/machine/%%i" | findstr "status"
    echo.
)

echo.
pause