@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: SCRIPT FOR PREPARING FRONTEND ZIP FOR BEGET DEPLOYMENT
:: =================================================================

echo ====================================================================
echo PREPARING FRONTEND FOR BEGET DEPLOYMENT
echo ====================================================================

set "BASE_DIR=%~dp0"
set "FRONTEND_DIR=%BASE_DIR%frontend"
set "TEMP_DIR=%BASE_DIR%temp-frontend-beget"
set "ZIP_NAME=frontend-beget.zip"
set "ZIP_PATH=%BASE_DIR%!ZIP_NAME!"

:: Check if frontend directory exists
if not exist "!FRONTEND_DIR!" (
    echo ERROR: Frontend directory not found: !FRONTEND_DIR!
    pause
    exit /b 1
)

echo Step 1: Cleaning previous build artifacts...
if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!"
if exist "!ZIP_PATH!" del "!ZIP_PATH!"

echo Step 2: Creating temporary directory...
mkdir "!TEMP_DIR!"

echo Step 3: Installing frontend dependencies...
cd /d "!FRONTEND_DIR!"
if exist node_modules rmdir /s /q node_modules
call npm install --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Step 4: Creating production environment file...
:: Create production .env file with Beget configuration
(
echo # Production Environment for Beget
echo REACT_APP_API_URL=https://your-domain.beget.tech/api
echo REACT_APP_ENVIRONMENT=production
echo GENERATE_SOURCEMAP=false
echo SKIP_PREFLIGHT_CHECK=true
) > "!FRONTEND_DIR!\.env.production.local"

echo Step 5: Building frontend for production...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo Step 6: Copying build files to temp directory...

:: Copy the built application
xcopy "!FRONTEND_DIR!\build" "!TEMP_DIR!\build" /E /I /Y

:: Copy configuration files
copy "!FRONTEND_DIR!\package.json" "!TEMP_DIR!\"
if exist "!FRONTEND_DIR!\package-lock.json" copy "!FRONTEND_DIR!\package-lock.json" "!TEMP_DIR!\"

:: Copy nginx configuration if exists
if exist "!FRONTEND_DIR!\nginx.conf" copy "!FRONTEND_DIR!\nginx.conf" "!TEMP_DIR!\"

:: Copy environment files
if exist "!FRONTEND_DIR!\.env.production" copy "!FRONTEND_DIR!\.env.production" "!TEMP_DIR!\"
copy "!FRONTEND_DIR!\.env.production.local" "!TEMP_DIR!\.env.production"

:: Copy project root environment files
if exist "!BASE_DIR!\.env.beget" copy "!BASE_DIR!\.env.beget" "!TEMP_DIR!\"

:: Copy public assets (icons, manifest, etc.)
xcopy "!FRONTEND_DIR!\public" "!TEMP_DIR!\public" /E /I /Y

echo Step 7: Creating nginx configuration for Beget...
(
echo server {
echo     listen 80;
echo     server_name your-domain.beget.tech;
echo.
echo     root /app/build;
echo     index index.html index.htm;
echo.
echo     # Handle React Router
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo.
echo     # Static assets caching
echo     location ~* \.(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo.
echo     # API proxy
echo     location /api/ {
echo         proxy_pass http://localhost:3001/;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade $http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo         proxy_cache_bypass $http_upgrade;
echo     }
echo.
echo     # Security headers
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo     add_header Referrer-Policy "no-referrer-when-downgrade" always;
echo.
echo     # Gzip compression
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_proxied expired no-cache no-store private must-revalidate auth;
echo     gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
echo }
) > "!TEMP_DIR!\nginx-beget.conf"

echo Step 8: Creating .htaccess for Apache (alternative to nginx)...
(
echo # Apache configuration for React Router
echo RewriteEngine On
echo RewriteBase /
echo.
echo # Handle Angular and React Router requests
echo RewriteRule ^index\.html$ - [L]
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo.
echo # Security headers
echo Header always set X-Frame-Options "SAMEORIGIN"
echo Header always set X-XSS-Protection "1; mode=block"
echo Header always set X-Content-Type-Options "nosniff"
echo.
echo # Caching for static assets
echo ^<IfModule mod_expires.c^>
echo     ExpiresActive on
echo     ExpiresByType text/css "access plus 1 year"
echo     ExpiresByType application/javascript "access plus 1 year"
echo     ExpiresByType image/png "access plus 1 year"
echo     ExpiresByType image/jpg "access plus 1 year"
echo     ExpiresByType image/jpeg "access plus 1 year"
echo     ExpiresByType image/gif "access plus 1 year"
echo     ExpiresByType image/svg+xml "access plus 1 year"
echo ^</IfModule^>
echo.
echo # Gzip compression
echo ^<IfModule mod_deflate.c^>
echo     AddOutputFilterByType DEFLATE text/plain
echo     AddOutputFilterByType DEFLATE text/html
echo     AddOutputFilterByType DEFLATE text/xml
echo     AddOutputFilterByType DEFLATE text/css
echo     AddOutputFilterByType DEFLATE application/xml
echo     AddOutputFilterByType DEFLATE application/xhtml+xml
echo     AddOutputFilterByType DEFLATE application/rss+xml
echo     AddOutputFilterByType DEFLATE application/javascript
echo     AddOutputFilterByType DEFLATE application/x-javascript
echo ^</IfModule^>
) > "!TEMP_DIR!\.htaccess"

echo Step 9: Creating deployment scripts...

:: Create simple HTTP server script for Node.js
(
echo const express = require('express'^);
echo const path = require('path'^);
echo const app = express(^);
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo // Serve static files from build directory
echo app.use(express.static(path.join(__dirname, 'build'^)^)^);
echo.
echo // Handle React Router
echo app.get('*', (req, res^) =^> {
echo   res.sendFile(path.join(__dirname, 'build', 'index.html'^)^);
echo }^);
echo.
echo app.listen(PORT, (^) =^> {
echo   console.log(`Frontend server running on port ${PORT}`^);
echo }^);
) > "!TEMP_DIR!\server.js"

:: Update package.json with server script
(
echo {
echo   "name": "production-crm-frontend",
echo   "version": "0.1.0",
echo   "private": true,
echo   "dependencies": {
echo     "express": "^4.18.0"
echo   },
echo   "scripts": {
echo     "start": "node server.js",
echo     "serve": "node server.js"
echo   },
echo   "engines": {
echo     "node": ">=14.0.0",
echo     "npm": ">=6.0.0"
echo   }
echo }
) > "!TEMP_DIR!\package-server.json"

:: Create startup script for Beget
(
echo #!/bin/bash
echo # Frontend startup script for Beget
echo echo "Starting Production CRM Frontend..."
echo cd /app
echo npm install express --save
echo node server.js
) > "!TEMP_DIR!\start.sh"

echo Step 10: Creating deployment README...
(
echo # Frontend Deployment Guide for Beget
echo.
echo ## Deployment Options
echo.
echo ### Option 1: Static Files ^(Recommended^)
echo 1. Upload the 'build' folder contents to your web directory
echo 2. Copy .htaccess to web root for Apache
echo 3. Configure your domain to point to the web directory
echo.
echo ### Option 2: Node.js Server
echo 1. Upload all files to your server
echo 2. Run: npm install express
echo 3. Run: node server.js
echo 4. Access via: http://your-domain:3000
echo.
echo ### Option 3: Nginx
echo 1. Upload 'build' folder to /var/www/html
echo 2. Use nginx-beget.conf configuration
echo 3. Restart nginx service
echo.
echo ## Configuration
echo.
echo ### Environment Variables
echo Update .env.production with your settings:
echo - REACT_APP_API_URL: Your backend API URL
echo - REACT_APP_ENVIRONMENT: production
echo.
echo ### API Configuration
echo Make sure your backend API is accessible at:
echo - https://your-domain.beget.tech/api
echo.
echo ## Files Included
echo - build/ - Production React build
echo - server.js - Node.js static server
echo - nginx-beget.conf - Nginx configuration
echo - .htaccess - Apache configuration
echo - package-server.json - Server dependencies
echo.
echo ## Testing
echo 1. Check if all static files load correctly
echo 2. Test React Router navigation
echo 3. Verify API connectivity
echo 4. Test responsive design on mobile
echo.
echo ## Troubleshooting
echo.
echo ### Common Issues:
echo - 404 on page refresh: Configure server for SPA routing
echo - API not accessible: Check CORS settings in backend
echo - Static files not loading: Check file permissions
echo - Slow loading: Enable gzip compression
echo.
echo ### File Permissions:
echo Set appropriate permissions for web files:
echo chmod 644 for files
echo chmod 755 for directories
echo.
echo ## Security
echo - All environment variables are build-time only
echo - No sensitive data is exposed to client
echo - Static files are served securely
echo - HTTPS is recommended for production
) > "!TEMP_DIR!\README-DEPLOYMENT.md"

echo Step 11: Creating ZIP archive...
cd /d "!BASE_DIR!"

:: Use PowerShell to create ZIP
powershell -command "Compress-Archive -Path '!TEMP_DIR!\*' -DestinationPath '!ZIP_PATH!' -Force"

if !errorlevel! equ 0 (
    echo SUCCESS: Frontend ZIP created successfully!
    echo File: !ZIP_PATH!
    
    :: Get file size
    for %%A in ("!ZIP_PATH!") do set "file_size=%%~zA"
    set /a "file_size_mb=!file_size! / 1024 / 1024"
    echo Size: !file_size_mb! MB
) else (
    echo ERROR: Failed to create ZIP archive
    pause
    exit /b 1
)

echo Step 12: Cleaning up temporary files...
if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!"
del "!FRONTEND_DIR!\.env.production.local"

echo ====================================================================
echo FRONTEND DEPLOYMENT PACKAGE READY!
echo ====================================================================
echo.
echo Archive: !ZIP_PATH!
echo.
echo Next steps:
echo 1. Upload !ZIP_NAME! to your Beget server
echo 2. Extract the archive: unzip !ZIP_NAME!
echo 3. Choose deployment method:
echo    - Static: Copy build/* to web directory
echo    - Node.js: Run npm install express && node server.js
echo    - Nginx: Use nginx-beget.conf configuration
echo.
echo IMPORTANT: 
echo - Update REACT_APP_API_URL in .env.production
echo - Configure your domain to point to the application
echo - Test all functionality after deployment
echo - Enable HTTPS for production use
echo.
pause
