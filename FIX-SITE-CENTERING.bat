@echo off
echo ================================================
echo 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ЦЕНТРИРОВАНИЯ САЙТА
echo ================================================
echo Проблема: весь сайт съехал влево
echo Причина: стили логина повлияли на основное приложение
echo Решение: изоляция стилей только для страниц авторизации
echo ================================================

cd frontend

echo 🔍 Проверяем исправления изоляции стилей...
findstr "display: none" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo ❌ LoginPage.tsx НЕ содержит изоляцию стилей!
    echo Нужно добавить display: none для .ant-layout
    pause
    exit /b 1
) else (
    echo ✅ LoginPage.tsx содержит изоляцию стилей
)

echo.
echo 🧹 Полная очистка старой сборки...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 📝 Настройка production конфигурации...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo.
echo 🔨 Сборка с ИСПРАВЛЕННОЙ изоляцией стилей...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

call npm run build

if not exist build (
    echo ❌ ОШИБКА СБОРКИ!
    pause
    exit /b 1
)

echo ✅ Сборка успешна!

echo.
echo 📦 Создание ИСПРАВЛЕННОГО архива...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo ================================================
    echo 🎉 ИСПРАВЛЕННЫЙ АРХИВ СОЗДАН!
    echo ================================================
    for %%F in (..\frontend-production.zip) do (
        echo 📦 Размер: %%~zF байт
        echo 📅 Время: %%~tF
    )
    echo.
    echo 🚀 СРОЧНО РАЗВЕРНИТЕ НА СЕРВЕРЕ:
    echo.
    echo SSH команды для Beget:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   # Загрузите новый frontend-production.zip
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo ✅ После развертывания:
    echo   🌐 https://kasuf.xyz - ДОЛЖЕН быть центрирован
    echo   🔑 https://kasuf.xyz/login - ДОЛЖЕН работать нормально
    echo   📱 Проверьте на мобильном тоже
    echo.
    echo ⚠️ Что исправлено:
    echo   - Изоляция стилей только для страниц авторизации
    echo   - Основное приложение не затронуто
    echo   - Логин центрирован, сайт нормальный
) else (
    echo ❌ ОШИБКА: архив не создан!
    pause
    exit /b 1
)

cd ..

echo.
echo ================================================
echo 🎯 СЛЕДУЮЩИЙ ШАГ: ЗАГРУЗИТЬ НА СЕРВЕР!
echo ================================================
pause