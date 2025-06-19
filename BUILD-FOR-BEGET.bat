@echo off
echo 🚀 Простая установка Production CRM на Beget

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен! Скачайте с nodejs.org
    pause
    exit /b 1
)

REM Создание директорий
echo 📁 Создание директорий...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "tmp" mkdir tmp

REM Копирование .env файла
if not exist ".env" (
    echo ⚙️ Копирование .env файла...
    copy ".env.beget" ".env"
    echo 🔧 ВАЖНО: Отредактируйте файл .env с вашими настройками!
    echo Нажмите любую клавишу после редактирования .env файла...
    pause
)

REM Установка зависимостей бэкенда
echo 📦 Установка зависимостей бэкенда...
cd backend
call npm ci --production
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей бэкенда
    pause
    exit /b 1
)

echo 🔨 Сборка бэкенда...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки бэкенда
    pause
    exit /b 1
)
cd ..

REM Сборка фронтенда
echo 📦 Сборка фронтенда...
cd frontend
call npm ci --production
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей фронтенда
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки фронтенда
    pause
    exit /b 1
)
cd ..

REM Создание bat файлов для запуска
echo 📝 Создание файлов запуска...

echo @echo off > start-backend.bat
echo cd backend >> start-backend.bat
echo set NODE_ENV=production >> start-backend.bat
echo set PORT=3001 >> start-backend.bat
echo node dist/src/main.js >> start-backend.bat

echo @echo off > start-migrations.bat
echo cd backend >> start-migrations.bat
echo npm run migration:run >> start-migrations.bat
echo pause >> start-migrations.bat

echo.
echo 🎉 Сборка завершена!
echo.
echo 📋 Следующие шаги:
echo 1. Отредактируйте .env файл с настройками БД и доменом
echo 2. Настройте PostgreSQL базу данных
echo 3. Запустите миграции: start-migrations.bat
echo 4. Запустите бэкенд: start-backend.bat
echo 5. Настройте веб-сервер для папки frontend\build
echo.
echo 📁 Готовые файлы:
echo - Backend: start-backend.bat
echo - Миграции: start-migrations.bat  
echo - Frontend: frontend\build\
echo.
pause
