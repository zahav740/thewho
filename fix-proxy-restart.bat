@echo off
echo Installing proxy middleware and restarting frontend...
cd frontend

REM Остановить текущий процесс
taskkill /F /IM node.exe 2>nul

REM Установить http-proxy-middleware
echo Installing http-proxy-middleware...
call npm install --save-dev http-proxy-middleware

REM Очистить кеш
echo Clearing cache...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .cache 2>nul

REM Удалить старый файл .env если есть
if exist .env.local del .env.local

REM Создать .env.local файл
echo Creating .env.local...
echo PORT=3001 > .env.local
echo GENERATE_SOURCEMAP=false >> .env.local

REM Запустить frontend
echo Starting frontend...
start /B npm start

echo Frontend restarted with proxy middleware!
echo The app should open at http://localhost:3001
pause
