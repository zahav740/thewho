@echo off
chcp 65001 > nul
echo ==============================================
echo   📁 ЭКСПОРТ ПЕРЕВОДОВ В JSON
echo ==============================================
echo.

echo Проверяем доступность API...
REM Проверяем оба порта
curl -s http://localhost:5100/api/translations/client > nul 2>&1
if %errorlevel% == 0 (
    set api_port=5100
    goto :api_found
)
curl -s http://localhost:5101/api/translations/client > nul 2>&1
if %errorlevel% == 0 (
    set api_port=5101
    goto :api_found
)

echo ❌ API недоступен ни на 5100, ни на 5101. Убедитесь, что backend запущен
pause
exit /b 1

:api_found
echo ✅ API доступен на порту %api_port%, начинаем экспорт...
echo.

node export-translations.js

echo.
echo Нажмите любую клавишу для завершения...
pause > nul
