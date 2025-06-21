@echo off
echo ==========================================
echo 🌐 СБОРКА ДЛЯ PRODUCTION (BEGET)
echo ==========================================
echo Backend: порт 5200
echo Frontend: порт 5201
echo Домен: https://kasuf.xyz
echo ==========================================

echo 📋 Настройка окружения для production...

REM Копирование правильных .env файлов для production
echo Настройка Backend (порт 5200, Supabase)...
copy backend\.env.production backend\.env

echo Настройка Frontend (порт 5201, kasuf.xyz API)...
copy frontend\.env.production frontend\.env

echo ✅ Окружение настроено для production!
echo.

echo 🔨 Сборка Backend...
cd backend
call npm install --production
call npm run build

if not exist dist (
    echo ❌ Ошибка сборки Backend!
    pause
    exit /b 1
)
echo ✅ Backend собран успешно!
cd ..

echo.
echo 🔨 Сборка Frontend...
cd frontend

REM Очистка предыдущей сборки
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

call npm install --production
set NODE_ENV=production
call npm run build

if not exist build (
    echo ❌ Ошибка сборки Frontend!
    cd ..
    pause
    exit /b 1
)
echo ✅ Frontend собран успешно!
cd ..

echo.
echo 📦 Создание архивов для Beget...

echo Создание архива Backend...
if exist backend-beget.zip del backend-beget.zip
cd backend
powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('.\', '..\backend-beget.zip', 'Optimal', $false)"
cd ..

echo Создание архива Frontend...
if exist frontend-beget.zip del frontend-beget.zip
cd frontend
powershell Compress-Archive -Path "build\*" -DestinationPath "..\frontend-beget.zip" -Force
cd ..

echo.
echo 📁 Обновление пакета развертывания...

REM Обновляем kasuf-xyz-deploy
if not exist kasuf-xyz-deploy\frontend mkdir kasuf-xyz-deploy\frontend
if not exist kasuf-xyz-deploy\backend mkdir kasuf-xyz-deploy\backend

copy frontend-beget.zip kasuf-xyz-deploy\frontend\
copy backend-beget.zip kasuf-xyz-deploy\backend\
copy backend\.env.production kasuf-xyz-deploy\backend\.env
copy frontend\.env.production kasuf-xyz-deploy\frontend\.env

echo.
echo ==========================================
echo ✅ СБОРКА ДЛЯ PRODUCTION ЗАВЕРШЕНА!
echo ==========================================
echo.
echo 📦 Созданы архивы:
echo   backend-beget.zip  (с портом 5200)
echo   frontend-beget.zip (с портом 5201)
echo.
echo 📁 Обновлен пакет: kasuf-xyz-deploy\
echo   ├── frontend\frontend-beget.zip
echo   ├── backend\backend-beget.zip
echo   └── правильные .env файлы
echo.
echo 🚀 Следующие шаги:
echo   1. Загрузите kasuf-xyz-deploy\ на сервер в /var/upload/
echo   2. Запустите на сервере: ./deploy.sh
echo.
echo 🌐 После развертывания:
echo   Сайт: https://kasuf.xyz
echo   API:  https://kasuf.xyz/api
echo.
echo ✅ Готово к загрузке на Beget!
pause