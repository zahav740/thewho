@echo off
echo ============================================
echo   ДИАГНОСТИКА ПРОБЛЕМ ЗАПУСКА
echo ============================================
echo.

echo 🔍 Проверяем системные требования...
echo.

REM Проверка Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js НЕ УСТАНОВЛЕН!
    echo Установите Node.js: https://nodejs.org/
    goto :end
) else (
    echo ✅ Node.js: 
    node --version
)

REM Проверка npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm НЕ НАЙДЕН!
    goto :end
) else (
    echo ✅ npm: 
    npm --version
)

REM Проверка PostgreSQL
echo.
echo 🗄️ Проверяем PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL НЕ ЗАПУЩЕН!
    echo.
    echo Возможные решения:
    echo 1. Запустите службу PostgreSQL в Windows
    echo 2. Используйте команду: net start postgresql-x64-14
    echo 3. Проверьте установку PostgreSQL
    echo.
) else (
    echo ✅ PostgreSQL запущен и доступен
)

REM Проверка портов
echo.
echo 🔌 Проверяем порты...
netstat -an | find "5100" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ Порт 5100 ЗАНЯТ! 
    echo Процессы на порту 5100:
    netstat -ano | find "5100"
    echo.
    echo Остановите процесс или используйте другой порт
) else (
    echo ✅ Порт 5100 свободен
)

netstat -an | find "5101" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ Порт 5101 ЗАНЯТ!
    echo Процессы на порту 5101:
    netstat -ano | find "5101"
) else (
    echo ✅ Порт 5101 свободен
)

REM Проверка файлов проекта
echo.
echo 📁 Проверяем файлы проекта...
if exist "%~dp0backend\package.json" (
    echo ✅ Backend package.json найден
) else (
    echo ❌ Backend package.json НЕ НАЙДЕН!
)

if exist "%~dp0frontend\package.json" (
    echo ✅ Frontend package.json найден
) else (
    echo ❌ Frontend package.json НЕ НАЙДЕН!
)

if exist "%~dp0backend\.env" (
    echo ✅ Backend .env файл найден
) else (
    echo ⚠️ Backend .env файл НЕ НАЙДЕН!
    echo Скопируйте .env.example в .env и настройте
)

if exist "%~dp0backend\node_modules" (
    echo ✅ Backend node_modules установлены
) else (
    echo ⚠️ Backend node_modules НЕ УСТАНОВЛЕНЫ!
    echo Выполните: cd backend && npm install
)

if exist "%~dp0frontend\node_modules" (
    echo ✅ Frontend node_modules установлены
) else (
    echo ⚠️ Frontend node_modules НЕ УСТАНОВЛЕНЫ!
    echo Выполните: cd frontend && npm install
)

echo.
echo ============================================
echo   РЕКОМЕНДАЦИИ ПО ЗАПУСКУ:
echo ============================================
echo.
echo 1. Убедитесь что PostgreSQL запущен
echo 2. Создайте базу данных 'thewho':
echo    psql -U postgres -c "CREATE DATABASE thewho;"
echo.
echo 3. Запустите backend:
echo    START-BACKEND-TS.bat
echo.
echo 4. Запустите frontend:
echo    START-FRONTEND-5101.bat
echo.
echo 5. Откройте: http://localhost:5101/excel-import
echo.

:end
echo ============================================
pause
