@echo off
echo 🚀 Создание архива для Beget...

REM Сначала собираем проект
echo 📦 Запуск сборки проекта...
call BUILD-FOR-BEGET.bat

echo 📦 Создание архива для загрузки...

REM Создание временной папки для архива
if exist "beget-upload" rmdir /s /q "beget-upload"
mkdir "beget-upload"

REM Копирование необходимых файлов
echo 📁 Копирование файлов...

REM Backend
xcopy "backend\dist" "beget-upload\backend\dist\" /E /I /Y
copy "backend\package.json" "beget-upload\backend\"
copy "backend\package-lock.json" "beget-upload\backend\"

REM Frontend build
xcopy "frontend\build" "beget-upload\frontend\build\" /E /I /Y

REM Конфигурационные файлы
copy ".env.beget" "beget-upload\"
copy ".htaccess" "beget-upload\"
copy "start-backend.bat" "beget-upload\"
copy "start-migrations.bat" "beget-upload\"
copy "ecosystem.config.json" "beget-upload\"

REM Документация
copy "BEGET-DEPLOY-GUIDE.md" "beget-upload\"
copy "WEBSERVER-SETUP.md" "beget-upload\"

REM Создание директорий
mkdir "beget-upload\uploads"
mkdir "beget-upload\logs"
mkdir "beget-upload\tmp"

REM Создание архива
echo 📦 Создание ZIP архива...
powershell -Command "Compress-Archive -Path 'beget-upload\*' -DestinationPath 'production-crm-beget-ready.zip' -Force"

REM Очистка временной папки
rmdir /s /q "beget-upload"

echo ✅ Архив создан: production-crm-beget-ready.zip
echo.
echo 🔧 Что в архиве:
echo - backend\dist\ - собранный бэкенд
echo - frontend\build\ - собранный фронтенд  
echo - .env.beget - конфигурация (отредактируйте!)
echo - .htaccess - настройки Apache
echo - start-backend.bat - запуск бэкенда
echo - документация и инструкции
echo.
echo 📋 Следующие шаги:
echo 1. Загрузите production-crm-beget-ready.zip на сервер Beget
echo 2. Распакуйте архив в корень сайта
echo 3. Отредактируйте .env.beget файл
echo 4. Переименуйте .env.beget в .env
echo 5. Настройте базу данных PostgreSQL
echo 6. Запустите миграции и бэкенд
echo.
pause
