@echo off
chcp 65001 > nul
echo ===== Перезапуск MCP серверов =====
echo.

echo Остановка всех процессов node.exe...
taskkill /F /IM node.exe /T > nul 2>&1
timeout /t 5 /nobreak > nul

echo Запуск Claude с оптимизированной конфигурацией...
start "" "C:\Users\apule\AppData\Roaming\Claude\Claude.exe" --mcp-config "C:\Users\apule\Downloads\TheWho\mcp-config.json"

echo.
echo Готово! Claude запущен с оптимизированной конфигурацией MCP.
echo.
echo Рекомендация: если проблема сохраняется, попробуйте:
echo 1. Закрыть все приложения, использующие много памяти
echo 2. Очистить кэш npm: npm cache clean --force
echo 3. Обновить Node.js до последней LTS версии
echo 4. Перезагрузить компьютер перед запуском
echo.
echo Нажмите любую клавишу для выхода...
pause > nul