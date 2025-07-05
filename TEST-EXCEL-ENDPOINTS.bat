@echo off
echo ====================================
echo Тестирование Excel Import API
echo ====================================
echo.

cd /d "%~dp0.."
node scripts\test-excel-endpoints.js

echo.
echo ====================================
echo Тестирование завершено
echo ====================================
pause
