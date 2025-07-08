@echo off
title Excel Import Module - Full Launch
color 0A

echo.
echo ═══════════════════════════════════════════════════
echo    🚀 АВТОМАТИЧЕСКИЙ ЗАПУСК EXCEL IMPORT MODULE
echo ═══════════════════════════════════════════════════
echo.
echo 🎯 Порты:
echo    Backend:  http://localhost:5100
echo    Frontend: http://localhost:5101
echo    Excel:    http://localhost:5101/excel-import
echo.
echo ⏳ Запускаем процессы...
echo.

REM Проверяем, свободны ли порты
netstat -an | find "5100" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ ВНИМАНИЕ: Порт 5100 уже используется!
    echo Остановите процесс на порту 5100 и попробуйте снова.
    pause
    exit /b 1
)

netstat -an | find "5101" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ ВНИМАНИЕ: Порт 5101 уже используется!
    echo Остановите процесс на порту 5101 и попробуйте снова.
    pause
    exit /b 1
)

echo ✅ Порты свободны, продолжаем...
echo.

REM Запускаем backend в отдельном окне
echo 🔧 Запускаем Backend на порту 5100...
start "Excel Import Backend" cmd /c "cd /d \"%~dp0\" && START-BACKEND-5100.bat"

REM Ждем 5 секунд для запуска backend
echo ⏳ Ждем запуска backend (5 секунд)...
timeout /t 5 /nobreak >nul

REM Запускаем frontend в отдельном окне  
echo 🎨 Запускаем Frontend на порту 5101...
start "Excel Import Frontend" cmd /c "cd /d \"%~dp0\" && START-FRONTEND-5101.bat"

echo.
echo ═══════════════════════════════════════════════════
echo ✅ ЗАПУСК ЗАВЕРШЕН!
echo.
echo 📱 Через 30-60 секунд откройте в браузере:
echo    👉 http://localhost:5101/excel-import
echo.
echo 🔍 Для отладки:
echo    Backend API: http://localhost:5100/api/docs
echo    Health Check: http://localhost:5100/api/health
echo.
echo 🛑 Для остановки закройте окна Backend и Frontend
echo ═══════════════════════════════════════════════════
echo.

REM Ждем 30 секунд и автоматически открываем браузер
echo ⏳ Автоматически откроем браузер через 30 секунд...
timeout /t 30 /nobreak >nul

echo 🌐 Открываем Excel Import в браузере...
start http://localhost:5101/excel-import

echo.
echo 🎉 Готово! Excel Import Module запущен!
echo Нажмите любую клавишу для закрытия этого окна...
pause >nul
