@echo off
echo ====================================
echo ⛔ ОСТАНОВКА ВСЕХ ПРОЦЕССОВ CRM
echo ====================================
echo.

echo Принудительная остановка всех процессов на портах 5100 и 5101...
echo.

:: Убиваем процессы на порту 5100
echo Останавливаем Frontend (порт 5100)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5100') do (
    if not "%%a"=="0" (
        echo Убиваем процесс %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Убиваем процессы на порту 5101  
echo Останавливаем Backend (порт 5101)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do (
    if not "%%a"=="0" (
        echo Убиваем процесс %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Убиваем процессы Node.js если висят
echo Останавливаем все процессы Node.js...
taskkill /F /IM node.exe >nul 2>&1

:: Убиваем npm процессы
echo Останавливаем npm процессы...
taskkill /F /IM npm.cmd >nul 2>&1

echo.
echo ✅ Все процессы остановлены!
echo.

:: Проверяем что порты свободны
echo Проверяем освобождение портов...
timeout /t 2 /nobreak >nul

netstat -ano | findstr :5100 >nul
if %errorlevel% neq 0 (
    echo ✅ Порт 5100 свободен
) else (
    echo ⚠️ Порт 5100 все еще занят
)

netstat -ano | findstr :5101 >nul
if %errorlevel% neq 0 (
    echo ✅ Порт 5101 свободен
) else (
    echo ⚠️ Порт 5101 все еще занят
)

echo.
echo Теперь можно запустить: AUTO-START-PRODUCTION.bat
echo.
pause
