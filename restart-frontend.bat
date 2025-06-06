@echo off
echo Restarting frontend with cache clearing...
cd frontend

REM Остановить текущий процесс
taskkill /F /IM node.exe 2>nul

REM Очистить кеш
echo Clearing cache...
rmdir /s /q node_modules\.cache 2>nul

REM Запустить frontend
echo Starting frontend...
start /B npm start

echo Frontend restarted!
echo Please clear your browser cache (Ctrl+Shift+Delete) to ensure changes take effect!
pause
