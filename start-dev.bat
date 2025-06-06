@echo off
echo ========================================
echo   Production CRM - Development Mode
echo ========================================
echo.

REM Проверка PostgreSQL
echo Проверка PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL не запущен или недоступен!
    echo Убедитесь, что PostgreSQL работает на порту 5432
    echo.
    choice /C YN /M "Продолжить без базы данных?"
    if errorlevel 2 exit /b 1
)

REM Получаем текущую директорию
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [1/4] Остановка запущенных процессов...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [2/4] Запуск Backend в режиме разработки...
cd backend
start "CRM Backend - Dev" cmd /k "npm run start:dev"

echo.
echo [3/4] Ожидание запуска Backend...
:wait_backend
timeout /t 2 >nul
curl -s http://localhost:3000/api >nul 2>&1
if %errorlevel% neq 0 (
    echo Ожидание Backend...
    goto wait_backend
)
echo [OK] Backend запущен!

echo.
echo [4/4] Запуск Frontend в режиме разработки...
cd ..\frontend
start "CRM Frontend - Dev" cmd /k "npm start"

echo.
echo ========================================
echo   Режим разработки активирован!
echo ========================================
echo.
echo Backend:  http://localhost:3000 (с автоперезагрузкой)
echo Frontend: http://localhost:3001 (с горячей перезагрузкой)
echo API Docs: http://localhost:3000/api/docs
echo.
echo Изменения в коде будут автоматически применяться!
echo.
echo Для остановки закройте окна консолей или нажмите Ctrl+C
echo.
pause
