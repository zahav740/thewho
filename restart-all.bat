@echo off
echo ========================================
echo   Production CRM - Restart Script
echo ========================================
echo.

echo [1/2] Остановка приложения...
call "%~dp0stop-all.bat"

echo.
echo [2/2] Запуск приложения...
call "%~dp0start-all.bat"
