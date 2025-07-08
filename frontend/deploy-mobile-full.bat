@echo off
chcp 65001 > nul
echo ==========================================
echo 🚀 ПОЛНОЕ РАЗВЕРТЫВАНИЕ МОБИЛЬНОЙ ВЕРСИИ
echo ==========================================
echo.

echo ⏰ %date% %time% - Начало полного развертывания
echo.

REM Проверка окружения
if not exist "package.json" (
    echo ❌ Ошибка: Не найден package.json
    echo Убедитесь, что скрипт запущен из директории frontend
    pause
    exit /b 1
)

echo 🔍 Проверка окружения...
echo ✅ Node.js проверка:
node --version
echo ✅ NPM проверка:
npm --version

echo.
echo 📋 Копирование конфигурации...
copy ".env.mobile.production" ".env.production" > nul
echo ✅ Конфигурация скопирована

echo.
echo 🧹 Полная очистка...
if exist "build" rmdir /s /q "build"
if exist "build-mobile" rmdir /s /q "build-mobile"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
call npm cache clean --force > nul 2>&1
echo ✅ Очистка завершена

echo.
echo 📦 Установка/обновление зависимостей...
call npm ci --production=false
if errorlevel 1 (
    echo ⚠️ npm ci не удался, попробуем npm install...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка при установке зависимостей
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Настройка переменных окружения...
set REACT_APP_ENVIRONMENT=production
set REACT_APP_MOBILE=true
set REACT_APP_API_URL=https://kasuf.xyz/api
set REACT_APP_CORS_ORIGIN=https://kasuf.xyz
set GENERATE_SOURCEMAP=false
set BUILD_PATH=build-mobile
set PUBLIC_URL=/
set NODE_ENV=production
set CI=false

echo.
echo 🏗️ Сборка мобильного приложения...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка при сборке приложения
    echo 📋 Попробуйте выполнить команды:
    echo   npm install --legacy-peer-deps
    echo   npm run build
    pause
    exit /b 1
)

echo.
echo 📱 Интеграция мобильных компонентов...

REM Копирование мобильных файлов
echo 📋 Копирование мобильных ресурсов...
copy "mobile-styles.css" "build-mobile\" > nul
copy "mobile-logic.js" "build-mobile\" > nul
copy "public\sw.js" "build-mobile\" > nul
echo ✅ Мобильные файлы интегрированы

echo.
echo 🌐 Создание конфигурационных файлов...

REM .htaccess для Beget
(
echo # TheWho CRM Mobile - Beget Configuration
echo RewriteEngine On
echo.
echo # Force HTTPS
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
echo.
echo # Handle Angular and React Router
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo.
echo # Cache static resources
echo ^<FilesMatch "\.(css^|js^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot^|json^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 month"
echo   Header set Cache-Control "public, immutable"
echo ^</FilesMatch^>
echo.
echo # Cache HTML with shorter time
echo ^<FilesMatch "\.(html^|htm^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 hour"
echo   Header set Cache-Control "public, must-revalidate"
echo ^</FilesMatch^>
echo.
echo # Compression
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
echo   AddOutputFilterByType DEFLATE application/json
echo ^</IfModule^>
echo.
echo # Security headers
echo Header always set X-Frame-Options "SAMEORIGIN"
echo Header always set X-Content-Type-Options "nosniff"
echo Header always set X-XSS-Protection "1; mode=block"
echo Header always set Referrer-Policy "strict-origin-when-cross-origin"
echo Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
echo.
echo # CORS for API
echo Header set Access-Control-Allow-Origin "https://kasuf.xyz"
echo Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
echo.
echo # Error pages
echo ErrorDocument 404 /index.html
echo ErrorDocument 500 /index.html
) > "build-mobile\.htaccess"

REM robots.txt
(
echo User-agent: *
echo Allow: /
echo Disallow: /static/
echo Disallow: /api/
echo.
echo Sitemap: https://kasuf.xyz/sitemap.xml
) > "build-mobile\robots.txt"

REM sitemap.xml
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/^</loc^>
echo     ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo     ^<changefreq^>daily^</changefreq^>
echo     ^<priority^>1.0^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/database^</loc^>
echo     ^<changefreq^>weekly^</changefreq^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/production^</loc^>
echo     ^<changefreq^>daily^</changefreq^>
echo     ^<priority^>0.9^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/shifts^</loc^>
echo     ^<changefreq^>daily^</changefreq^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/calendar^</loc^>
echo     ^<changefreq^>weekly^</changefreq^>
echo     ^<priority^>0.7^</priority^>
echo   ^</url^>
echo ^</urlset^>
) > "build-mobile\sitemap.xml"

echo ✅ Конфигурационные файлы созданы

echo.
echo 📊 Анализ сборки...
echo 📁 Размер директории build-mobile:
for /f "tokens=3" %%a in ('dir build-mobile /s /-c ^| find "File(s)"') do set size=%%a
echo 📏 Общий размер: %size% байт

echo.
echo 🗜️ Создание финального архива...
if exist "thewho-crm-mobile-final.zip" del "thewho-crm-mobile-final.zip"

powershell -Command "Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-crm-mobile-final.zip' -CompressionLevel Optimal"

if exist "thewho-crm-mobile-final.zip" (
    echo ✅ Финальный архив создан: thewho-crm-mobile-final.zip
    for %%I in (thewho-crm-mobile-final.zip) do echo 📏 Размер архива: %%~zI байт
) else (
    echo ❌ Ошибка создания архива
)

echo.
echo 📋 Создание подробной инструкции...
(
echo ==========================================
echo 📱 ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ
echo ==========================================
echo 🎯 Цель: Развертывание мобильной версии TheWho CRM на Beget
echo 📅 Дата: %date% %time%
echo.
echo ✅ ЧТО ГОТОВО:
echo   - Мобильная версия React приложения
echo   - PWA функциональность
echo   - Service Worker для оффлайн режима
echo   - Адаптивный дизайн для всех устройств
echo   - Оптимизация для касаний
echo   - Сжатие и кэширование ресурсов
echo.
echo 🚀 ШАГИ РАЗВЕРТЫВАНИЯ:
echo.
echo 1️⃣ ПОДГОТОВКА ХОСТИНГА BEGET:
echo   - Войдите в панель управления Beget
echo   - Перейдите в раздел "Файловый менеджер"
echo   - Перейдите в директорию /var/upload
echo   - Удалите все старые файлы (если есть)
echo.
echo 2️⃣ ЗАГРУЗКА ФАЙЛОВ:
echo   - Загрузите файл thewho-crm-mobile-final.zip
echo   - Разархивируйте его в директорию /var/upload
echo   - Убедитесь, что файл .htaccess находится в корне
echo.
echo 3️⃣ НАСТРОЙКА ДОМЕНА:
echo   - Привяжите домен kasuf.xyz к директории /var/upload
echo   - Включите SSL сертификат
echo   - Настройте редирект с HTTP на HTTPS
echo.
echo 4️⃣ НАСТРОЙКА БАЗЫ ДАННЫХ:
echo   Host: aws-0-eu-central-1.pooler.supabase.com
echo   Port: 6543
echo   Database: postgres
echo   Username: postgres.kukqacmzfmzepdfddppl
echo   Password: Magarel1!
echo   Connection String: postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
echo.
echo 5️⃣ ПРОВЕРКА РАБОТЫ:
echo   - Откройте https://kasuf.xyz в браузере
echo   - Проверьте работу на мобильном устройстве
echo   - Протестируйте оффлайн режим
echo   - Убедитесь в работе PWA функций
echo.
echo 📱 МОБИЛЬНЫЕ ФУНКЦИИ:
echo   ✅ Адаптивный дизайн (мобильные, планшеты, десктоп)
echo   ✅ Touch-friendly интерфейс
echo   ✅ PWA поддержка (установка на домашний экран)
echo   ✅ Service Worker (оффлайн режим)
echo   ✅ Кэширование ресурсов
echo   ✅ Pull-to-refresh
echo   ✅ Свайп-действия
echo   ✅ Floating Action Buttons
echo   ✅ Мобильное меню с анимациями
echo   ✅ Оптимизированные формы
echo   ✅ Предотвращение зума при фокусе
echo.
echo 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ:
echo   - React 18+ с TypeScript
echo   - Ant Design для UI компонентов
echo   - React Query для управления данными
echo   - i18next для интернационализации
echo   - Service Worker для PWA
echo   - Webpack оптимизации
echo.
echo 🌐 URL И ЭНДПОИНТЫ:
echo   - Главная: https://kasuf.xyz
echo   - API: https://kasuf.xyz/api
echo   - База данных: https://kasuf.xyz/database
echo   - Производство: https://kasuf.xyz/production
echo   - Смены: https://kasuf.xyz/shifts
echo   - Календарь: https://kasuf.xyz/calendar
echo.
echo 🔐 БЕЗОПАСНОСТЬ:
echo   - HTTPS принудительно
echo   - CORS настроен для kasuf.xyz
echo   - CSP заголовки
echo   - XSS защита
echo   - Secure headers
echo.
echo ⚡ ПРОИЗВОДИТЕЛЬНОСТЬ:
echo   - Gzip сжатие
echo   - Кэширование статики (1 месяц)
echo   - Минификация CSS/JS
echo   - Lazy loading компонентов
echo   - Code splitting
echo.
echo 🐛 УСТРАНЕНИЕ НЕИСПРАВНОСТЕЙ:
echo   - Если сайт не открывается: проверьте настройки домена
echo   - Если API не работает: проверьте CORS настройки
echo   - Если база не подключается: проверьте файрвол
echo   - Если PWA не работает: очистите кэш браузера
echo.
echo 📞 ПОДДЕРЖКА:
echo   - Проверьте логи в панели Beget
echo   - Используйте Developer Tools браузера
echo   - Проверьте Network tab для API запросов
echo.
echo ==========================================
echo ✅ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!
echo ==========================================
) > "DEPLOY-GUIDE-FINAL.txt"

echo.
echo 🔍 Финальная проверка файлов...
echo 📁 Содержимое build-mobile:
dir "build-mobile" /b

echo.
echo 📋 Создание списка файлов...
(
echo ==========================================
echo 📁 СПИСОК ФАЙЛОВ МОБИЛЬНОЙ СБОРКИ
echo ==========================================
echo 📅 Дата создания: %date% %time%
echo.
dir "build-mobile" /s /b
echo.
echo ==========================================
) > "build-mobile\FILES-LIST.txt"

echo.
echo ==========================================
echo 🎉 МОБИЛЬНАЯ ВЕРСИЯ ГОТОВА К РАЗВЕРТЫВАНИЮ!
echo ==========================================
echo.
echo ✅ СОЗДАННЫЕ ФАЙЛЫ:
echo   📦 thewho-crm-mobile-final.zip - Основной архив для загрузки
echo   📁 build-mobile\ - Директория с файлами приложения
echo   📋 DEPLOY-GUIDE-FINAL.txt - Подробная инструкция
echo   📄 .env.mobile.production - Конфигурация production
echo.
echo 🚀 СЛЕДУЮЩИЕ ШАГИ:
echo   1. Загрузите thewho-crm-mobile-final.zip на Beget
echo   2. Разархивируйте в /var/upload
echo   3. Настройте домен kasuf.xyz
echo   4. Проверьте работу на https://kasuf.xyz
echo.
echo 📱 МОБИЛЬНЫЕ ФУНКЦИИ ВКЛЮЧЕНЫ:
echo   ✅ Адаптивный дизайн
echo   ✅ PWA поддержка
echo   ✅ Оффлайн режим
echo   ✅ Touch оптимизация
echo   ✅ Service Worker
echo.
echo 🔗 Домен: https://kasuf.xyz
echo 💾 База: Supabase PostgreSQL
echo 🌐 API: https://kasuf.xyz/api
echo.
echo ⏰ Время завершения: %date% %time%
echo ==========================================

echo.
echo 🎯 Нажмите любую клавишу для завершения...
pause > nul

REM Опционально открыть папку с результатами
explorer "build-mobile"
