@echo off
chcp 65001 >nul
title Production CRM - System Monitor

:monitor_loop
cls
echo ==========================================
echo     PRODUCTION CRM - SYSTEM MONITOR
echo ==========================================
echo.
echo 🕐 %date% %time%
echo.

REM Проверка процессов
echo 📊 СТАТУС ПРОЦЕССОВ:
echo.

REM Проверка Node.js процессов
set backend_running=0
set frontend_running=0

for /f %%i in ('tasklist /fi "imagename eq node.exe" 2^>nul ^| find /c "node.exe"') do set node_count=%%i
if %node_count% gtr 0 (
    echo ✅ Backend (Node.js): %node_count% процессов запущено
    set backend_running=1
) else (
    echo ❌ Backend (Node.js): НЕ ЗАПУЩЕН
)

REM Проверка serve процессов  
for /f %%i in ('tasklist /fi "imagename eq serve.cmd" 2^>nul ^| find /c "serve.cmd"') do set serve_count=%%i
if %serve_count% gtr 0 (
    echo ✅ Frontend (serve): %serve_count% процессов запущено
    set frontend_running=1
) else (
    echo ❌ Frontend (serve): НЕ ЗАПУЩЕН
)

echo.
echo 🌐 СТАТУС ПОРТОВ:
echo.

REM Проверка портов
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Порт 3001 (Backend): ЗАНЯТ
) else (
    echo ❌ Порт 3001 (Backend): СВОБОДЕН
)

netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Порт 3000 (Frontend): ЗАНЯТ  
) else (
    echo ❌ Порт 3000 (Frontend): СВОБОДЕН
)

echo.
echo 🔍 СТАТУС СЕРВИСОВ:
echo.

REM Проверка PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL: РАБОТАЕТ
) else (
    echo ❌ PostgreSQL: НЕ ДОСТУПЕН
)

REM Проверка API
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API: ОТВЕЧАЕТ
) else (
    echo ❌ Backend API: НЕ ОТВЕЧАЕТ
)

REM Проверка Frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: ДОСТУПЕН
) else (
    echo ❌ Frontend: НЕ ДОСТУПЕН
)

echo.
echo 📈 ПРОИЗВОДИТЕЛЬНОСТЬ:
echo.

REM Использование CPU и памяти
for /f "skip=1" %%p in ('wmic cpu get loadpercentage /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do (
        if not "%%i"=="" echo 💻 CPU: %%i%%
    )
)

for /f "skip=1" %%p in ('wmic OS get TotalVirtualMemorySize^,FreeVirtualMemorySize /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do (
        if not "%%i"=="" set mem=%%i
    )
)

echo 💾 Memory: Мониторинг доступен

echo.
echo 🔗 ДОСТУПНЫЕ ССЫЛКИ:
echo.
echo   Frontend:        http://localhost:3000
echo   Backend API:     http://localhost:3001
echo   API Docs:        http://localhost:3001/api/docs
echo   Health Check:    http://localhost:3001/api/health
echo.

REM Суммарный статус
if %backend_running%==1 if %frontend_running%==1 (
    echo ✅ ОБЩИЙ СТАТУС: СИСТЕМА РАБОТАЕТ
) else (
    echo ❌ ОБЩИЙ СТАТУС: СИСТЕМА НЕ ПОЛНОСТЬЮ ЗАПУЩЕНА
)

echo.
echo ==========================================
echo Автообновление через 30 секунд...
echo Нажмите Ctrl+C для выхода
echo ==========================================

timeout /t 30 /nobreak >nul
goto monitor_loop
