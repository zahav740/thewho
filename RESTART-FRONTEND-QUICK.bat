@echo off
chcp 65001 > nul
echo ============================================
echo БЫСТРЫЙ ПЕРЕЗАПУСК FRONTEND
echo ============================================
echo.

echo Остановка frontend...
taskkill /F /FI "WINDOWTITLE eq npm*" 2>nul
taskkill /F /FI "WINDOWTITLE eq start*" 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Запуск frontend...
cd frontend
start cmd /k "npm start"
cd ..

echo.
echo ============================================
echo Frontend перезапущен!
echo Откройте http://localhost:3000
echo ============================================
pause
