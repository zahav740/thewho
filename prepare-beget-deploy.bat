@echo off
echo ===================================
echo Подготовка к развертыванию на Beget
echo ===================================

rem Создаем директории для развертывания
if not exist "beget-deploy" mkdir beget-deploy
if not exist "beget-deploy\frontend" mkdir beget-deploy\frontend
if not exist "beget-deploy\backend" mkdir beget-deploy\backend

echo Копирование файлов...

rem Копируем архивы
copy frontend-beget.zip beget-deploy\frontend\
copy backend-beget.zip beget-deploy\backend\

echo Создание конфигурационных файлов...

rem Backend .env
echo # Supabase Database Configuration > beget-deploy\backend\.env
echo DB_HOST=aws-0-eu-central-1.pooler.supabase.com >> beget-deploy\backend\.env
echo DB_PORT=6543 >> beget-deploy\backend\.env
echo DB_USERNAME=postgres.kukqacmzfmzepdfddppl >> beget-deploy\backend\.env
echo DB_PASSWORD=Magarel1! >> beget-deploy\backend\.env
echo DB_NAME=postgres >> beget-deploy\backend\.env
echo. >> beget-deploy\backend\.env
echo # JWT Configuration >> beget-deploy\backend\.env
echo JWT_SECRET=YourSuperSecretJWTKeyForBeget256BitsLong! >> beget-deploy\backend\.env
echo JWT_EXPIRES_IN=7d >> beget-deploy\backend\.env
echo. >> beget-deploy\backend\.env
echo # App Configuration >> beget-deploy\backend\.env
echo NODE_ENV=production >> beget-deploy\backend\.env
echo PORT=5200 >> beget-deploy\backend\.env
echo. >> beget-deploy\backend\.env
echo # CORS для kasuf.xyz >> beget-deploy\backend\.env
echo CORS_ORIGIN=https://kasuf.xyz >> beget-deploy\backend\.env
echo. >> beget-deploy\backend\.env
echo # Database URL для TypeORM >> beget-deploy\backend\.env
echo DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres >> beget-deploy\backend\.env
echo. >> beget-deploy\backend\.env
echo # Frontend Configuration >> beget-deploy\backend\.env
echo REACT_APP_API_URL=https://kasuf.xyz/api >> beget-deploy\backend\.env
echo REACT_APP_ENVIRONMENT=production >> beget-deploy\backend\.env

rem Frontend .env
echo REACT_APP_API_URL=https://kasuf.xyz/api > beget-deploy\frontend\.env
echo REACT_APP_ENVIRONMENT=production >> beget-deploy\frontend\.env
echo PORT=5201 >> beget-deploy\frontend\.env

rem Создаем инструкцию по развертыванию
echo ========================================== > beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ НА BEGET >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo ========================================== >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 1. Загрузите все файлы из beget-deploy/ в /var/upload/ на сервере >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 2. Распакуйте архивы: >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    cd /var/upload/backend ^&^& unzip backend-beget.zip >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    cd /var/upload/frontend ^&^& unzip frontend-beget.zip >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 3. Установите зависимости: >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    cd /var/upload/backend ^&^& npm install --production ^&^& npm run build >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    cd /var/upload/frontend ^&^& npm install --production ^&^& npm run build >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 4. Установите PM2 и serve: >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    npm install -g pm2 serve >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 5. Запустите приложения: >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    pm2 start ecosystem.config.js >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    pm2 save >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo    pm2 startup >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo 6. Настройте Nginx согласно kasuf.xyz.nginx.conf >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo. >> beget-deploy\DEPLOY-INSTRUCTIONS.txt
echo ГОТОВО! Сайт будет доступен на https://kasuf.xyz >> beget-deploy\DEPLOY-INSTRUCTIONS.txt

echo.
echo ✅ Подготовка завершена!
echo.
echo Созданы файлы:
echo 📁 beget-deploy\
echo   ├── frontend\frontend-beget.zip
echo   ├── backend\backend-beget.zip
echo   ├── .env файлы для frontend и backend
echo   └── DEPLOY-INSTRUCTIONS.txt
echo.
echo Следующие шаги:
echo 1. Загрузите содержимое beget-deploy\ на сервер в /var/upload/
echo 2. Следуйте инструкциям в DEPLOY-INSTRUCTIONS.txt
echo.
echo 🚀 Готово к развертыванию!
pause