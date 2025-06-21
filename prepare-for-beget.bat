@echo off
echo ==========================================
echo ПОЛНАЯ ПОДГОТОВКА ПРОЕКТА ДЛЯ BEGET
echo ==========================================
echo Backend: порт 5200
echo Frontend: порт 5201
echo Домен: https://kasuf.xyz
echo ==========================================

echo.
echo 📋 Шаг 1: Проверка конфигурации...

echo Проверяем backend .env...
findstr "PORT=5200" backend\.env >nul
if errorlevel 1 (
    echo ❌ Backend порт не настроен правильно!
    echo Текущие настройки backend:
    type backend\.env
    pause
    exit /b 1
) else (
    echo ✅ Backend порт 5200 настроен правильно
)

echo Проверяем frontend .env.local...
findstr "PORT=5201" frontend\.env.local >nul
if errorlevel 1 (
    echo ❌ Frontend порт не настроен правильно!
    echo Текущие настройки frontend:
    type frontend\.env.local
    pause
    exit /b 1
) else (
    echo ✅ Frontend порт 5201 настроен правильно
)

echo.
echo 🔨 Шаг 2: Пересборка Frontend...
cd frontend

echo Очистка старой сборки...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Сборка с новыми настройками...
call npm run build

if not exist build (
    echo ❌ Ошибка сборки frontend!
    cd ..
    pause
    exit /b 1
)

echo ✅ Frontend собран успешно!
cd ..

echo.
echo 🔨 Шаг 3: Пересборка Backend...
cd backend

echo Сборка backend...
call npm run build

if not exist dist (
    echo ❌ Ошибка сборки backend!
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend собран успешно!
cd ..

echo.
echo 📦 Шаг 4: Создание архивов...

echo Создание архива frontend...
if exist frontend-beget.zip del frontend-beget.zip
cd frontend
powershell Compress-Archive -Path "build\*" -DestinationPath "..\frontend-beget.zip" -Force
cd ..

echo Создание архива backend...
if exist backend-beget.zip del backend-beget.zip
cd backend
powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('.\', '..\backend-beget.zip', 'Optimal', $false)"
cd ..

echo.
echo 📁 Шаг 5: Обновление файлов развертывания...

echo Копирование архивов в kasuf-xyz-deploy...
if not exist kasuf-xyz-deploy\frontend mkdir kasuf-xyz-deploy\frontend
if not exist kasuf-xyz-deploy\backend mkdir kasuf-xyz-deploy\backend

copy frontend-beget.zip kasuf-xyz-deploy\frontend\
copy backend-beget.zip kasuf-xyz-deploy\backend\

echo Обновление .env файлов...
echo # Supabase Database Configuration > kasuf-xyz-deploy\backend\.env
echo DB_HOST=aws-0-eu-central-1.pooler.supabase.com >> kasuf-xyz-deploy\backend\.env
echo DB_PORT=6543 >> kasuf-xyz-deploy\backend\.env
echo DB_USERNAME=postgres.kukqacmzfmzepdfddppl >> kasuf-xyz-deploy\backend\.env
echo DB_PASSWORD=Magarel1! >> kasuf-xyz-deploy\backend\.env
echo DB_NAME=postgres >> kasuf-xyz-deploy\backend\.env
echo. >> kasuf-xyz-deploy\backend\.env
echo # JWT Configuration >> kasuf-xyz-deploy\backend\.env
echo JWT_SECRET=YourSuperSecretJWTKeyForBeget256BitsLong! >> kasuf-xyz-deploy\backend\.env
echo JWT_EXPIRES_IN=7d >> kasuf-xyz-deploy\backend\.env
echo. >> kasuf-xyz-deploy\backend\.env
echo # App Configuration >> kasuf-xyz-deploy\backend\.env
echo NODE_ENV=production >> kasuf-xyz-deploy\backend\.env
echo PORT=5200 >> kasuf-xyz-deploy\backend\.env
echo. >> kasuf-xyz-deploy\backend\.env
echo # CORS для kasuf.xyz >> kasuf-xyz-deploy\backend\.env
echo CORS_ORIGIN=https://kasuf.xyz >> kasuf-xyz-deploy\backend\.env
echo. >> kasuf-xyz-deploy\backend\.env
echo # Database URL для TypeORM >> kasuf-xyz-deploy\backend\.env
echo DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres >> kasuf-xyz-deploy\backend\.env

echo REACT_APP_API_URL=https://kasuf.xyz/api > kasuf-xyz-deploy\frontend\.env
echo REACT_APP_ENVIRONMENT=production >> kasuf-xyz-deploy\frontend\.env
echo PORT=5201 >> kasuf-xyz-deploy\frontend\.env

echo.
echo ==========================================
echo ✅ ПОДГОТОВКА ЗАВЕРШЕНА!
echo ==========================================
echo.
echo 📁 Файлы готовы к загрузке на Beget:
echo   kasuf-xyz-deploy\frontend\frontend-beget.zip
echo   kasuf-xyz-deploy\backend\backend-beget.zip
echo   kasuf-xyz-deploy\*.env (конфигурация)
echo   kasuf-xyz-deploy\*.js (PM2, deploy скрипты)
echo   kasuf-xyz-deploy\*.conf (Nginx)
echo.
echo 🚀 Следующие шаги:
echo   1. Загрузите содержимое kasuf-xyz-deploy\ на сервер в /var/upload/
echo   2. Настройте Nginx согласно kasuf.xyz.nginx.conf
echo   3. Запустите ./deploy.sh на сервере
echo.
echo 🌐 После развертывания:
echo   Сайт: https://kasuf.xyz
echo   API: https://kasuf.xyz/api
echo   Health: https://kasuf.xyz/health
echo.
echo ✅ Готово к развертыванию на Beget!
pause