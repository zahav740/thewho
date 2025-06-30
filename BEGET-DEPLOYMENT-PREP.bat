@echo off
setlocal enabledelayedexpansion

echo ====================================
echo BEGET DEPLOYMENT PREPARATION
echo ====================================
echo Target: kasuf.xyz
echo Backend Port: 5200 (SSL)
echo Database: Supabase
echo Frontend: Vite Build
echo DATE: %date% %time%
echo.

REM Set production environment variables
set PROD_PORT=5200
set PROD_DOMAIN=kasuf.xyz
set FRONTEND_DIST=frontend/dist

echo 1. Creating production environment files...
echo.

REM Create production .env file for backend
echo Creating backend/.env.production...
(
echo # PRODUCTION ENVIRONMENT - BEGET SERVER
echo NODE_ENV=production
echo PORT=%PROD_PORT%
echo.
echo # SSL Configuration
echo HTTPS=true
echo SSL_KEY_PATH=/etc/ssl/private/kasuf.xyz.key
echo SSL_CERT_PATH=/etc/ssl/certs/kasuf.xyz.crt
echo.
echo # CORS Configuration
echo CORS_ORIGIN=https://kasuf.xyz,https://www.kasuf.xyz
echo CORS_CREDENTIALS=true
echo.
echo # Database Configuration - Supabase
echo DB_HOST=aws-0-eu-central-1.pooler.supabase.com
echo DB_PORT=6543
echo DB_NAME=postgres
echo DB_USER=postgres.kukqacmzfmzepdfddppl
echo DB_PASSWORD=Magarel1!
echo DB_SSL=true
echo DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
echo.
echo # Security
echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
echo BCRYPT_ROUNDS=12
echo.
echo # File Upload
echo UPLOAD_DEST=./uploads
echo MAX_FILE_SIZE=10485760
echo.
echo # API Configuration
echo API_PREFIX=/api
echo API_VERSION=v1
echo.
echo # Logging
echo LOG_LEVEL=info
echo LOG_FILE=./logs/app.log
echo.
echo # Health Check
echo HEALTH_CHECK_ENDPOINT=/health
) > backend\.env.production

REM Create production package.json for backend
echo Creating backend/package.production.json...
(
echo {
echo   "name": "production-crm-backend",
echo   "version": "1.0.0",
echo   "description": "Production CRM Backend for Beget",
echo   "main": "dist/main.js",
echo   "scripts": {
echo     "start": "node dist/main.js",
echo     "start:prod": "NODE_ENV=production node dist/main.js",
echo     "build": "nest build",
echo     "prestart:prod": "npm run build"
echo   },
echo   "dependencies": {
echo     "@nestjs/common": "^10.0.0",
echo     "@nestjs/core": "^10.0.0",
echo     "@nestjs/platform-express": "^10.0.0",
echo     "@nestjs/typeorm": "^10.0.0",
echo     "@nestjs/swagger": "^7.0.0",
echo     "typeorm": "^0.3.17",
echo     "pg": "^8.11.0",
echo     "class-validator": "^0.14.0",
echo     "class-transformer": "^0.5.1",
echo     "reflect-metadata": "^0.1.13",
echo     "rxjs": "^7.8.1"
echo   },
echo   "engines": {
echo     "node": ">=18.0.0",
echo     "npm": ">=8.0.0"
echo   }
echo }
) > backend\package.production.json

echo.
echo 2. Creating Beget-specific configuration files...
echo.

REM Create PM2 ecosystem file for Beget
echo Creating ecosystem.beget.config.js...
(
echo module.exports = {
echo   apps: [{
echo     name: 'production-crm-backend',
echo     script: 'dist/main.js',
echo     cwd: '/var/www/kasuf/data/www/kasuf.xyz/backend',
echo     instances: 1,
echo     exec_mode: 'cluster',
echo     env: {
echo       NODE_ENV: 'production',
echo       PORT: %PROD_PORT%
echo     },
echo     env_production: {
echo       NODE_ENV: 'production',
echo       PORT: %PROD_PORT%
echo     },
echo     log_file: './logs/combined.log',
echo     out_file: './logs/out.log',
echo     error_file: './logs/error.log',
echo     log_date_format: 'YYYY-MM-DD HH:mm Z',
echo     merge_logs: true,
echo     max_memory_restart: '1G',
echo     restart_delay: 4000,
echo     autorestart: true,
echo     watch: false,
echo     ignore_watch: ['node_modules', 'logs', 'uploads']
echo   }]
echo };
) > ecosystem.beget.config.js

REM Create nginx configuration for reverse proxy
echo Creating nginx.beget.conf...
(
echo server {
echo     listen 80;
echo     listen [::]:80;
echo     server_name kasuf.xyz www.kasuf.xyz;
echo     return 301 https://$server_name$request_uri;
echo }
echo.
echo server {
echo     listen 443 ssl http2;
echo     listen [::]:443 ssl http2;
echo     server_name kasuf.xyz www.kasuf.xyz;
echo.
echo     # SSL Configuration
echo     ssl_certificate /etc/ssl/certs/kasuf.xyz.crt;
echo     ssl_certificate_key /etc/ssl/private/kasuf.xyz.key;
echo     ssl_protocols TLSv1.2 TLSv1.3;
echo     ssl_ciphers HIGH:!aNULL:!MD5;
echo.
echo     # Frontend ^(Vite build^)
echo     location / {
echo         root /var/www/kasuf/data/www/kasuf.xyz/frontend/dist;
echo         try_files $uri $uri/ /index.html;
echo         index index.html;
echo.
echo         # Cache static assets
echo         location ~* \\.^(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot^)$ {
echo             expires 1y;
echo             add_header Cache-Control "public, immutable";
echo         }
echo     }
echo.
echo     # Backend API
echo     location /api/ {
echo         proxy_pass https://localhost:%PROD_PORT%;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade $http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo         proxy_cache_bypass $http_upgrade;
echo         proxy_read_timeout 300;
echo         proxy_connect_timeout 300;
echo         proxy_send_timeout 300;
echo     }
echo.
echo     # Health check
echo     location /health {
echo         proxy_pass https://localhost:%PROD_PORT%;
echo         access_log off;
echo     }
echo }
) > nginx.beget.conf

echo.
echo 3. Building backend for production...
echo.

cd backend

echo Installing production dependencies...
npm install --only=production

echo Building TypeScript to JavaScript...
npm run build
if !errorlevel!==0 (
    echo ✅ Backend build successful
) else (
    echo ❌ Backend build failed
    pause
    exit /b 1
)

cd ..

echo.
echo 4. Building frontend with Vite...
echo.

cd frontend

echo Installing frontend dependencies...
npm install

echo Creating production environment file...
(
echo VITE_API_URL=https://kasuf.xyz/api
echo VITE_ENVIRONMENT=production
echo VITE_DOMAIN=kasuf.xyz
echo VITE_SSL=true
) > .env.production

echo Building frontend with Vite...
npm run build
if !errorlevel!==0 (
    echo ✅ Frontend build successful
) else (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

cd ..

echo.
echo 5. Creating deployment archive...
echo.

REM Create deployment directory structure
mkdir beget-deployment 2>nul
mkdir beget-deployment\backend 2>nul
mkdir beget-deployment\frontend 2>nul
mkdir beget-deployment\config 2>nul

REM Copy backend production files
echo Copying backend files...
xcopy backend\dist beget-deployment\backend\dist\ /E /I /Y >nul
xcopy backend\node_modules beget-deployment\backend\node_modules\ /E /I /Y >nul
copy backend\.env.production beget-deployment\backend\.env >nul
copy backend\package.production.json beget-deployment\backend\package.json >nul

REM Copy frontend build
echo Copying frontend build...
xcopy frontend\dist beget-deployment\frontend\dist\ /E /I /Y >nul

REM Copy configuration files
echo Copying configuration files...
copy ecosystem.beget.config.js beget-deployment\config\ >nul
copy nginx.beget.conf beget-deployment\config\ >nul

REM Create deployment scripts
echo Creating deployment scripts...

REM SSH deployment script
(
echo #!/bin/bash
echo # Beget deployment script
echo echo "Starting deployment to kasuf.xyz..."
echo.
echo # Stop existing application
echo pm2 stop production-crm-backend 2^>/dev/null ^|^| true
echo.
echo # Backup existing deployment
echo if [ -d "/var/www/kasuf/data/www/kasuf.xyz/backend" ]; then
echo   mv /var/www/kasuf/data/www/kasuf.xyz/backend /var/www/kasuf/data/www/kasuf.xyz/backend.backup.$(date +%%Y%%m%%d-%%H%%M%%S^)
echo fi
echo.
echo if [ -d "/var/www/kasuf/data/www/kasuf.xyz/frontend" ]; then
echo   mv /var/www/kasuf/data/www/kasuf.xyz/frontend /var/www/kasuf/data/www/kasuf.xyz/frontend.backup.$(date +%%Y%%m%%d-%%H%%M%%S^)
echo fi
echo.
echo # Create directories
echo mkdir -p /var/www/kasuf/data/www/kasuf.xyz/backend/logs
echo mkdir -p /var/www/kasuf/data/www/kasuf.xyz/frontend
echo.
echo # Copy new files
echo cp -r backend/* /var/www/kasuf/data/www/kasuf.xyz/backend/
echo cp -r frontend/* /var/www/kasuf/data/www/kasuf.xyz/frontend/
echo.
echo # Set permissions
echo chown -R kasuf:kasuf /var/www/kasuf/data/www/kasuf.xyz/
echo chmod -R 755 /var/www/kasuf/data/www/kasuf.xyz/
echo.
echo # Install PM2 if not installed
echo npm install -g pm2 2^>/dev/null ^|^| true
echo.
echo # Start application with PM2
echo cd /var/www/kasuf/data/www/kasuf.xyz/
echo pm2 start config/ecosystem.beget.config.js --env production
echo pm2 save
echo pm2 startup
echo.
echo # Configure nginx (manual step^)
echo echo "⚠️  Manual step required:"
echo echo "Copy config/nginx.beget.conf to your nginx sites-available"
echo echo "and restart nginx service"
echo.
echo echo "✅ Deployment completed!"
echo echo "🌐 Frontend: https://kasuf.xyz"
echo echo "🔧 Backend API: https://kasuf.xyz/api"
echo echo "❤️  Health check: https://kasuf.xyz/health"
) > beget-deployment\deploy.sh

REM Create upload script for Windows
(
echo @echo off
echo echo Uploading to Beget server...
echo echo.
echo echo Please ensure you have SSH access configured to your Beget server
echo echo.
echo echo Command to upload:
echo echo scp -r beget-deployment/* your-username@kasuf.xyz:/var/www/kasuf/data/www/kasuf.xyz/
echo echo.
echo echo Command to deploy:
echo echo ssh your-username@kasuf.xyz "cd /var/www/kasuf/data/www/kasuf.xyz && chmod +x deploy.sh && ./deploy.sh"
echo echo.
echo pause
) > beget-deployment\upload.bat

REM Create archive
echo Creating final archive...
powershell -command "Compress-Archive -Path 'beget-deployment\*' -DestinationPath 'kasuf-xyz-deployment.zip' -Force"

echo.
echo ====================================
echo DEPLOYMENT PREPARATION COMPLETE!
echo ====================================
echo.
echo 📦 Archive created: kasuf-xyz-deployment.zip
echo 📁 Deployment folder: beget-deployment\
echo.
echo 🌐 Production URLs:
echo    Frontend: https://kasuf.xyz
echo    Backend API: https://kasuf.xyz/api  
echo    Health Check: https://kasuf.xyz/health
echo.
echo 📋 Next steps:
echo 1. Upload kasuf-xyz-deployment.zip to your Beget server
echo 2. Extract the archive to /var/www/kasuf/data/www/kasuf.xyz/
echo 3. Run: chmod +x deploy.sh && ./deploy.sh
echo 4. Configure nginx with the provided config
echo 5. Configure SSL certificates for kasuf.xyz
echo.
echo 🔧 Configuration files included:
echo    - .env.production (Backend environment^)
echo    - ecosystem.beget.config.js (PM2 configuration^)  
echo    - nginx.beget.conf (Nginx reverse proxy^)
echo    - deploy.sh (Deployment script^)
echo.
echo 🗄️ Database: Configured for Supabase
echo 🔒 SSL: Configured for HTTPS
echo ⚡ Frontend: Vite production build
echo 🚀 Backend: NestJS production build
echo.
echo Ready for deployment to kasuf.xyz!
echo.
pause