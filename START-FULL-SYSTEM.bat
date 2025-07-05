@echo off
echo ======================================
echo ПОЛНЫЙ ЗАПУСК CRM СИСТЕМЫ
echo ======================================

set ROOT_DIR=C:\Users\kasuf\Downloads\TheWho\production-crm

echo.
echo [1/5] Проверка и установка зависимостей Backend...
cd /d "%ROOT_DIR%\backend"
if not exist node_modules (
    echo Установка зависимостей Backend...
    call npm install
)

echo.
echo [2/5] Проверка и установка зависимостей Frontend...
cd /d "%ROOT_DIR%\frontend"
if not exist node_modules (
    echo Установка зависимостей Frontend...
    call npm install
)

echo.
echo [3/5] Компиляция Backend...
cd /d "%ROOT_DIR%\backend"
call npm run build

echo.
echo [4/5] Запуск Backend сервера...
start "Backend Server" cmd /c "cd /d \"%ROOT_DIR%\backend\" && npm run start:dev"

echo Ожидание запуска Backend (10 секунд)...
timeout /t 10 /nobreak > nul

echo.
echo [5/5] Запуск Frontend сервера...
cd /d "%ROOT_DIR%\frontend"
start "Frontend Server" cmd /c "cd /d \"%ROOT_DIR%\frontend\" && npm start"

echo.
echo ======================================
echo СИСТЕМА ЗАПУЩЕНА!
echo ======================================
echo Backend:  http://localhost:5100
echo Frontend: http://localhost:5101
echo API Docs: http://localhost:5100/api/docs
echo ======================================

pause
