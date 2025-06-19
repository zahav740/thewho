@echo off
echo 🚀 Подготовка Production CRM для Beget с Supabase...

echo 📝 Обновление конфигурации для Supabase...

REM Обновление backend main.ts
if exist "backend\src\main.beget.ts" (
    copy "backend\src\main.beget.ts" "backend\src\main.ts"
    echo ✅ main.ts обновлен
)

REM Обновление ormconfig для Supabase
if exist "backend\ormconfig.beget.ts" (
    copy "backend\ormconfig.beget.ts" "backend\ormconfig.ts"
    echo ✅ ormconfig.ts обновлен для Supabase
)

REM Обновление .env для фронтенда
echo REACT_APP_API_URL=https://kasuf.xyz/api > frontend\.env.production
echo REACT_APP_ENVIRONMENT=production >> frontend\.env.production
echo ✅ Frontend .env обновлен

echo 📦 Сборка фронтенда...
cd frontend
call npm ci --production
call npm run build
cd ..

echo 📦 Сборка бэкенда...
cd backend
call npm ci --production
call npm run build
cd ..

echo 📦 Создание архива для Beget...
powershell -Command "Compress-Archive -Path backend\dist, backend\package.json, backend\package-lock.json, backend\ormconfig.ts, frontend\build, nginx, .env.beget.supabase, docker-compose.beget.supabase.yml, beget-deploy, BEGET-DEPLOY-GUIDE.md -DestinationPath production-crm-beget-supabase.zip -Force"

echo ✅ Архив production-crm-beget-supabase.zip создан!
echo 🔧 Следующие шаги на сервере Beget:
echo 1. Загрузите архив на сервер Beget
echo 2. Распакуйте архив
echo 3. Отредактируйте .env.beget.supabase (пароли и домен)
echo 4. Запустите: chmod +x beget-deploy/*.sh
echo 5. Запустите: ./beget-deploy/setup-supabase.sh
echo 6. Настройте веб-сервер для проксирования портов 5100/5101
echo.
echo 🌐 После настройки:
echo    Frontend: https://kasuf.xyz (порт 5101)
echo    Backend: https://kasuf.xyz/api (порт 5100)

pause
