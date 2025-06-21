@echo off
chcp 65001 > nul
echo ==========================================
echo 📱 СБОРКА МОБИЛЬНОЙ ВЕРСИИ THEWHO CRM
echo ==========================================
echo.

echo ⏰ %date% %time% - Начало сборки мобильной версии
echo.

REM Переход в директорию frontend
cd /d "%~dp0"
if not exist "package.json" (
    echo ❌ Ошибка: Не найден package.json в текущей директории
    echo Убедитесь, что скрипт запущен из директории frontend
    pause
    exit /b 1
)

echo 🧹 Очистка предыдущих сборок...
if exist "build" rmdir /s /q "build"
if exist "build-mobile" rmdir /s /q "build-mobile"
echo ✅ Очистка завершена

echo.
echo 📦 Установка зависимостей...
call npm install
if errorlevel 1 (
    echo ❌ Ошибка при установке зависимостей
    pause
    exit /b 1
)

echo.
echo 🏗️ Сборка React приложения для production...
set REACT_APP_API_URL=https://kasuf.xyz/api
set REACT_APP_ENVIRONMENT=production
set REACT_APP_MOBILE=true
set GENERATE_SOURCEMAP=false
set BUILD_PATH=build-mobile

call npm run build
if errorlevel 1 (
    echo ❌ Ошибка при сборке приложения
    pause
    exit /b 1
)

echo.
echo 📋 Копирование мобильных файлов...
copy "mobile-styles.css" "build-mobile\" > nul
copy "mobile-logic.js" "build-mobile\" > nul
echo ✅ Мобильные файлы скопированы

echo.
echo 🔧 Настройка .htaccess для Beget...
(
echo # Настройки для мобильной версии TheWho CRM
echo RewriteEngine On
echo.
echo # Перенаправление HTTP на HTTPS
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
echo.
echo # Single Page Application - перенаправление всех запросов на index.html
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo.
echo # Кэширование статических ресурсов
echo ^<FilesMatch "\.(css^|js^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 month"
echo   Header set Cache-Control "public, immutable"
echo ^</FilesMatch^>
echo.
echo # Сжатие файлов
echo ^<IfModule mod_deflate.c^>
echo   AddOutputFilterByType DEFLATE text/plain
echo   AddOutputFilterByType DEFLATE text/html
echo   AddOutputFilterByType DEFLATE text/xml
echo   AddOutputFilterByType DEFLATE text/css
echo   AddOutputFilterByType DEFLATE application/xml
echo   AddOutputFilterByType DEFLATE application/xhtml+xml
echo   AddOutputFilterByType DEFLATE application/rss+xml
echo   AddOutputFilterByType DEFLATE application/javascript
echo   AddOutputFilterByType DEFLATE application/x-javascript
echo ^</IfModule^>
echo.
echo # Безопасность
echo Header always set X-Frame-Options DENY
echo Header always set X-Content-Type-Options nosniff
echo Header always set Referrer-Policy "strict-origin-when-cross-origin"
echo.
echo # CORS для API
echo Header set Access-Control-Allow-Origin "https://kasuf.xyz"
echo Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo Header set Access-Control-Allow-Headers "Content-Type, Authorization"
) > "build-mobile\.htaccess"

echo ✅ .htaccess создан

echo.
echo 📱 Оптимизация для мобильных устройств...

REM Минификация CSS и JS файлов
echo 🔧 Минификация файлов...
for /r "build-mobile\static\css" %%f in (*.css) do (
    echo Обработка: %%~nxf
)
for /r "build-mobile\static\js" %%f in (*.js) do (
    echo Обработка: %%~nxf
)

echo.
echo 📊 Анализ размера сборки...
echo 📁 Содержимое build-mobile:
dir "build-mobile" /s /-c

echo.
echo 🗜️ Создание архива для Beget...
if exist "thewho-crm-mobile.zip" del "thewho-crm-mobile.zip"

REM Создание архива с помощью PowerShell
powershell -Command "Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-crm-mobile.zip' -CompressionLevel Optimal"

if exist "thewho-crm-mobile.zip" (
    echo ✅ Архив создан: thewho-crm-mobile.zip
    for %%I in (thewho-crm-mobile.zip) do echo 📏 Размер архива: %%~zI байт
) else (
    echo ❌ Ошибка создания архива
)

echo.
echo 🌐 Создание дополнительных файлов для Beget...

REM Создание robots.txt
(
echo User-agent: *
echo Allow: /
echo Sitemap: https://kasuf.xyz/sitemap.xml
) > "build-mobile\robots.txt"

REM Создание sitemap.xml
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/^</loc^>
echo     ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo     ^<priority^>1.0^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/database^</loc^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/production^</loc^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo ^</urlset^>
) > "build-mobile\sitemap.xml"

echo ✅ SEO файлы созданы

echo.
echo 📋 Создание инструкции по деплою...
(
echo ==========================================
echo 📱 ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ НА BEGET
echo ==========================================
echo.
echo 1. Загрузите файл thewho-crm-mobile.zip в панель управления Beget
echo 2. Разархивируйте в директорию /var/upload вашего домена
echo 3. Убедитесь, что все файлы имеют правильные права доступа
echo 4. Проверьте работу приложения по адресу https://kasuf.xyz
echo.
echo 🔧 НАСТРОЙКИ БАЗЫ ДАННЫХ:
echo - Host: aws-0-eu-central-1.pooler.supabase.com
echo - Port: 6543
echo - Database: postgres
echo - User: postgres.kukqacmzfmzepdfddppl
echo - Password: Magarel1!
echo.
echo 📱 МОБИЛЬНЫЕ ФУНКЦИИ:
echo - PWA поддержка
echo - Оффлайн режим
echo - Адаптивный дизайн
echo - Touch-friendly интерфейс
echo - Кэширование ресурсов
echo.
echo 🌐 URL: https://kasuf.xyz
echo 📅 Дата сборки: %date% %time%
echo ==========================================
) > "DEPLOY-MOBILE-GUIDE.txt"

echo.
echo ==========================================
echo ✅ СБОРКА МОБИЛЬНОЙ ВЕРСИИ ЗАВЕРШЕНА!
echo ==========================================
echo.
echo 📁 Файлы готовы к развертыванию:
echo   - thewho-crm-mobile.zip
echo   - build-mobile\ (директория)
echo   - DEPLOY-MOBILE-GUIDE.txt
echo.
echo 🚀 Следующие шаги:
echo   1. Загрузите thewho-crm-mobile.zip на Beget
echo   2. Разархивируйте в /var/upload
echo   3. Настройте домен kasuf.xyz
echo   4. Проверьте работу мобильной версии
echo.
echo ⏰ Время завершения: %date% %time%
echo ==========================================

echo.
echo Нажмите любую клавишу для завершения...
pause > nul
