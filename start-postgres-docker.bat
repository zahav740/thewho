@echo off
chcp 65001 >nul
title PostgreSQL в Docker
color 0B

echo.
echo ================================================================
echo                 POSTGRESQL В DOCKER
echo ================================================================
echo.

echo 🐳 Проверяем Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker не установлен или недоступен
    echo.
    echo Установите Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo ✅ Docker доступен

echo.
echo 🔄 Запускаем PostgreSQL в Docker...
echo.

REM Останавливаем существующий контейнер, если есть
docker stop production-crm-postgres >nul 2>&1
docker rm production-crm-postgres >nul 2>&1

REM Запускаем новый контейнер PostgreSQL
docker run -d ^
  --name production-crm-postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=production_crm ^
  -p 5432:5432 ^
  postgres:13

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка запуска PostgreSQL в Docker
    pause
    exit /b 1
)

echo ✅ PostgreSQL контейнер запущен
echo.
echo 🔄 Ожидание готовности PostgreSQL...

:wait_loop
timeout /t 2 /nobreak >nul
docker exec production-crm-postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⏳ Ожидание запуска PostgreSQL...
    goto :wait_loop
)

echo ✅ PostgreSQL готов к работе!
echo.
echo 📋 Информация о подключении:
echo 🔗 Host: localhost
echo 🔌 Port: 5432
echo 👤 User: postgres
echo 🔑 Password: postgres
echo 🗃️ Database: production_crm
echo.
echo 🐳 Контейнер: production-crm-postgres
echo.
echo Команды для управления:
echo - Остановить: docker stop production-crm-postgres
echo - Запустить:  docker start production-crm-postgres
echo - Удалить:    docker rm production-crm-postgres
echo.

echo 🚀 Теперь можно запустить приложение:
echo .\fix-and-restart.bat
echo.
pause
