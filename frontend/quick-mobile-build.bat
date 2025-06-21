@echo off
chcp 65001 > nul
echo ==========================================
echo 📱 БЫСТРАЯ СБОРКА МОБИЛЬНОЙ ВЕРСИИ
echo ==========================================
echo.

echo ⏰ %date% %time% - Начало сборки
echo.

REM Проверка директории
if not exist "package.json" (
    echo ❌ Ошибка: package.json не найден
    echo Запустите скрипт из директории frontend
    pause
    exit /b 1
)

echo 🔍 Проверка окружения...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден
    pause
    exit /b 1
)

echo ✅ Node.js найден

echo.
echo 🧹 Очистка предыдущих сборок...
if exist "build" rmdir /s /q "build"
if exist "build-mobile" rmdir /s /q "build-mobile"

echo.
echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo 📥 Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Настройка переменных окружения...
set REACT_APP_ENVIRONMENT=production
set REACT_APP_MOBILE=true
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false
set BUILD_PATH=build
set NODE_ENV=production

echo.
echo 🏗️ Сборка приложения...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки
    echo.
    echo 💡 Попробуйте:
    echo 1. Проверить ошибки TypeScript выше
    echo 2. Запустить: npm install
    echo 3. Запустить: npm start (для проверки в dev режиме)
    pause
    exit /b 1
)

echo.
echo 📁 Переименование в build-mobile...
if exist "build" (
    if exist "build-mobile" rmdir /s /q "build-mobile"
    rename "build" "build-mobile"
    echo ✅ Переименовано в build-mobile
)

echo.
echo 📋 Копирование мобильных файлов...
if exist "mobile-styles.css" (
    copy "mobile-styles.css" "build-mobile\" > nul
    echo ✅ mobile-styles.css скопирован
)

if exist "mobile-logic.js" (
    copy "mobile-logic.js" "build-mobile\" > nul
    echo ✅ mobile-logic.js скопирован
)

if exist "public\sw.js" (
    copy "public\sw.js" "build-mobile\" > nul
    echo ✅ sw.js скопирован
)

echo.
echo 🌐 Создание .htaccess...
(
echo RewriteEngine On
echo.
echo # Force HTTPS
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
echo.
echo # Handle React Router
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo.
echo # Cache static files
echo ^<FilesMatch "\.(css^|js^|png^|jpg^|gif^|ico^|svg^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 month"
echo ^</FilesMatch^>
) > "build-mobile\.htaccess"

echo ✅ .htaccess создан

echo.
echo 🗜️ Создание архива...
if exist "thewho-mobile.zip" del "thewho-mobile.zip"

powershell -Command "Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-mobile.zip' -CompressionLevel Optimal" > nul 2>&1

if exist "thewho-mobile.zip" (
    echo ✅ Архив создан: thewho-mobile.zip
    for %%I in (thewho-mobile.zip) do echo 📏 Размер: %%~zI байт
) else (
    echo ❌ Не удалось создать архив
)

echo.
echo ==========================================
echo ✅ СБОРКА ЗАВЕРШЕНА УСПЕШНО!
echo ==========================================
echo.
echo 📁 Результаты:
echo   - build-mobile\ (директория для загрузки)
echo   - thewho-mobile.zip (архив для Beget)
echo.
echo 🚀 Следующие шаги:
echo   1. Загрузите thewho-mobile.zip на Beget
echo   2. Разархивируйте в /var/upload
echo   3. Настройте домен kasuf.xyz
echo   4. Проверьте https://kasuf.xyz
echo.
echo ⏰ Время: %date% %time%
echo ==========================================

echo.
echo Нажмите любую клавишу для завершения...
pause > nul
