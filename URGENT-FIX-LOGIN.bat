@echo off
echo =============================================
echo КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ЦЕНТРИРОВАНИЯ ЛОГИНА
echo =============================================

cd frontend

echo 🔧 Проверяем исправленные файлы...
findstr "rootContainerStyles" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo ❌ LoginPage.tsx НЕ ИСПРАВЛЕН!
    echo Файл не содержит rootContainerStyles
    pause
    exit /b 1
) else (
    echo ✅ LoginPage.tsx исправлен правильно
)

echo 🧹 Полная очистка...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 📝 Создание ПРАВИЛЬНОГО .env для продакшена...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo 🎯 Проверяем конфигурацию...
echo Содержимое .env:
type .env
echo.

echo 🔨 Сборка с исправленным позиционированием...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

echo Запускаем npm run build...
call npm run build

if not exist build (
    echo ❌ КРИТИЧЕСКАЯ ОШИБКА: Сборка провалилась!
    echo Проверьте ошибки выше
    pause
    exit /b 1
)

echo ✅ Сборка успешна!

echo 🔍 Проверяем содержимое сборки...
if exist build\index.html (
    echo ✅ index.html найден
    echo Размер index.html:
    for %%F in (build\index.html) do echo %%~zF байт
) else (
    echo ❌ index.html НЕ НАЙДЕН!
    pause
    exit /b 1
)

if exist build\static (
    echo ✅ Статические файлы найдены
    dir build\static /b
) else (
    echo ❌ Статические файлы не найдены!
)

echo 📦 Создание ИСПРАВЛЕННОГО архива...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
echo Архивируем содержимое build/...
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo ===============================================
    echo 🎉 УСПЕХ! ИСПРАВЛЕННЫЙ АРХИВ СОЗДАН!
    echo ===============================================
    for %%F in (..\frontend-production.zip) do echo 📦 Размер архива: %%~zF байт
    echo.
    echo 🚀 НЕМЕДЛЕННО загрузите этот архив на сервер:
    echo.
    echo SSH команды для Beget:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   # Загрузите frontend-production.zip через файловый менеджер
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo 📍 После развертывания проверьте:
    echo   🌐 https://kasuf.xyz/login - ДОЛЖЕН быть центрирован!
    echo   📱 Проверьте на мобильном тоже
    echo.
    echo ⚠️ ВАЖНО: Этот архив содержит ИСПРАВЛЕННОЕ позиционирование
    echo    с rootContainerStyles и абсолютным position: fixed
    echo.
) else (
    echo ❌ ОШИБКА: Архив НЕ создан!
    pause
    exit /b 1
)

cd ..

echo.
echo 🎯 СЛЕДУЮЩИЙ ШАГ: Загрузите frontend-production.zip на сервер
echo и выполните команды развертывания выше!
echo.
pause