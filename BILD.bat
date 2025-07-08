@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo    KASUF CRM BUILD SCRIPT - ENHANCED SECURITY VERSION
echo    Original script improved with security components
echo ================================================================
echo.

REM --- Settings ---
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "DEPLOY_PACKAGE_DIR=%PROJECT_ROOT%deploy_package"
set "ARCHIVE_NAME=deploy.zip"

REM =================================================================
echo [STEP 1/6] Cleaning up old artifacts...
if exist "%DEPLOY_PACKAGE_DIR%" ( rd /s /q "%DEPLOY_PACKAGE_DIR%" )
if exist "%PROJECT_ROOT%%ARCHIVE_NAME%" ( del "%PROJECT_ROOT%%ARCHIVE_NAME%" )
mkdir "%DEPLOY_PACKAGE_DIR%" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\frontend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\security" > nul 2>&1
echo [OK] Staging directory has been created.
echo.

REM =================================================================
echo [STEP 2/6] Building Frontend with Security Settings...
cd /d "%FRONTEND_DIR%"
echo [INFO] Installing dependencies (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed!
    goto :error
)

REM Set secure build environment
set "GENERATE_SOURCEMAP=false"
set "REACT_APP_API_URL=/api"
set "REACT_APP_ENVIRONMENT=production"

echo [INFO] Building project with security settings (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    goto :error
)
echo [OK] Frontend build completed securely.
echo.

REM =================================================================
echo [STEP 3/6] Staging Frontend files with Security...
REM Dynamically find the frontend build directory build or dist AFTER build
set "FRONTEND_BUILD_DIR="

if exist "%FRONTEND_DIR%\build" (
    set "FRONTEND_BUILD_DIR=%FRONTEND_DIR%\build"
    goto :build_dir_found
)

if exist "%FRONTEND_DIR%\dist" (
    set "FRONTEND_BUILD_DIR=%FRONTEND_DIR%\dist"
    goto :build_dir_found
)

echo [ERROR] Frontend build directory (build or dist) was not found after build!
goto :error

:build_dir_found
echo [INFO] Found build directory: !FRONTEND_BUILD_DIR!
echo [INFO] Copying frontend files to staging area...
xcopy "!FRONTEND_BUILD_DIR!\*" "%DEPLOY_PACKAGE_DIR%\frontend\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy frontend files!
    goto :error
)
echo [OK] Frontend files have been staged successfully.
echo.

REM =================================================================
echo [STEP 4/6] Staging Backend files with Security...
cd /d "%BACKEND_DIR%"
echo [INFO] Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    goto :error
)

echo [INFO] Copying backend dist files...
mkdir "%DEPLOY_PACKAGE_DIR%\backend\dist" > nul 2>&1
xcopy "%BACKEND_DIR%\dist\*" "%DEPLOY_PACKAGE_DIR%\backend\dist\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy backend dist files!
    goto :error
)

echo [INFO] Copying package files...
copy "%BACKEND_DIR%\package.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul
copy "%BACKEND_DIR%\package-lock.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul
copy "%BACKEND_DIR%\ecosystem.config.js" "%DEPLOY_PACKAGE_DIR%\backend\" > nul

echo [OK] Backend files staged.
echo.

REM =================================================================
echo [STEP 5/6] Creating SECURE Production Configuration...
echo [INFO] Creating enhanced production .env file with security...
echo # KASUF CRM - SECURE PRODUCTION ENVIRONMENT > "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # Generated: %date% %time% >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # ⚠️  ВАЖНО: Измените пароли перед развертыванием! >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo. >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo NODE_ENV=production >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo PORT=5200 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo HOST=0.0.0.0 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo. >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # Security Settings >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo JWT_SECRET=CHANGE_THIS_JWT_SECRET_VERY_LONG_SECURE_KEY_FOR_PRODUCTION_2025 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo BCRYPT_ROUNDS=12 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo MAX_LOGIN_ATTEMPTS=5 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo LOCKOUT_TIME=900000 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo ENABLE_RATE_LIMITING=true >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo. >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # Database (change password!) >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo DATABASE_URL=postgresql://postgres:CHANGE_THIS_DB_PASSWORD@localhost:5432/kasuf_crm >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo. >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # CORS and API >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo CORS_ORIGIN=https://kasuf.xyz,http://kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo TRUSTED_PROXIES=127.0.0.1,::1 >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo. >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo # Monitoring >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo ENABLE_PROMETHEUS=true >> "%DEPLOY_PACKAGE_DIR%\backend\.env"
echo LOG_LEVEL=warn >> "%DEPLOY_PACKAGE_DIR%\backend\.env"

echo [INFO] Creating SECURE production config for frontend...
cd /d "%DEPLOY_PACKAGE_DIR%\frontend"
echo // Secure Production API configuration > config.js
echo window.APP_CONFIG = { >> config.js
echo   API_BASE_URL: '/api', >> config.js
echo   ENVIRONMENT: 'production', >> config.js
echo   SECURITY_ENABLED: true, >> config.js
echo   VERSION: '1.0.0' >> config.js
echo }; >> config.js

echo [INFO] Creating SECURE production .htaccess with security headers...
echo # KASUF CRM - SECURE PRODUCTION HTACCESS > .htaccess
echo # Enhanced with security headers and protections >> .htaccess
echo. >> .htaccess
echo RewriteEngine On >> .htaccess
echo. >> .htaccess
echo # Security Headers >> .htaccess
echo Header always set X-Content-Type-Options "nosniff" >> .htaccess
echo Header always set X-Frame-Options "SAMEORIGIN" >> .htaccess
echo Header always set X-XSS-Protection "1; mode=block" >> .htaccess
echo Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" >> .htaccess
echo Header always set Referrer-Policy "strict-origin-when-cross-origin" >> .htaccess
echo Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()" >> .htaccess
echo. >> .htaccess
echo # Remove server information >> .htaccess
echo Header unset Server >> .htaccess
echo Header unset X-Powered-By >> .htaccess
echo. >> .htaccess
echo # API Proxying to Node.js backend with security >> .htaccess
echo RewriteRule ^^api/(.*)$ http://127.0.0.1:5200/api/$1 [P,L,QSA] >> .htaccess
echo. >> .htaccess
echo # CORS Headers (restrictive) >> .htaccess
echo Header always set Access-Control-Allow-Origin "https://kasuf.xyz" >> .htaccess
echo Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" >> .htaccess
echo Header always set Access-Control-Allow-Headers "Content-Type, Authorization" >> .htaccess
echo Header always set Access-Control-Max-Age "86400" >> .htaccess
echo. >> .htaccess
echo # Static files with security >> .htaccess
echo ^^^<FilesMatch "\.(css^^^|js^^^|png^^^|jpg^^^|jpeg^^^|gif^^^|svg^^^|ico^^^|woff^^^|woff2^^^|ttf^^^|eot)$"^^^> >> .htaccess
echo     Require all granted >> .htaccess
echo     Header set Cache-Control "public, max-age=31536000" >> .htaccess
echo     Header set X-Content-Type-Options "nosniff" >> .htaccess
echo ^^^</FilesMatch^^^> >> .htaccess
echo. >> .htaccess
echo # Block access to sensitive files >> .htaccess
echo ^^^<FilesMatch "^\..*"^^^> >> .htaccess
echo     Require all denied >> .htaccess
echo ^^^</FilesMatch^^^> >> .htaccess
echo. >> .htaccess
echo # Block common attack patterns >> .htaccess
echo RewriteCond %%{QUERY_STRING} (union.*select.*from) [NC,OR] >> .htaccess
echo RewriteCond %%{QUERY_STRING} (script.*alert.*\() [NC,OR] >> .htaccess
echo RewriteCond %%{QUERY_STRING} (eval.*\() [NC] >> .htaccess
echo RewriteRule .* - [F,L] >> .htaccess
echo. >> .htaccess
echo # React Router (secure) >> .htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> .htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> .htaccess
echo RewriteCond %%{REQUEST_URI} !^^/api/ >> .htaccess
echo RewriteCond %%{REQUEST_URI} !^^/\.well-known/ >> .htaccess
echo RewriteRule . /index.html [L] >> .htaccess

echo [INFO] Copying security components if available...
if exist "%PROJECT_ROOT%docker-compose.security.yml" (
    copy "%PROJECT_ROOT%docker-compose.security.yml" "%DEPLOY_PACKAGE_DIR%\security\" > nul
    echo [OK] Docker security configuration copied.
)
if exist "%PROJECT_ROOT%deploy-secure.sh" (
    copy "%PROJECT_ROOT%deploy-secure.sh" "%DEPLOY_PACKAGE_DIR%\security\" > nul
    echo [OK] Secure deployment script copied.
)
if exist "%PROJECT_ROOT%nginx\nginx-security.conf" (
    mkdir "%DEPLOY_PACKAGE_DIR%\security\nginx" > nul 2>&1
    copy "%PROJECT_ROOT%nginx\nginx-security.conf" "%DEPLOY_PACKAGE_DIR%\security\nginx\" > nul
    echo [OK] Nginx security configuration copied.
)

echo [OK] SECURE production configs created.
echo.

REM =================================================================
echo [STEP 6/6] Creating deployment README with security instructions...
echo [INFO] Creating deployment documentation...

echo # KASUF CRM - Production Deployment Package > "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## Generated: %date% %time% >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🚀 Quick Deployment >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 1. Upload this package to your web server >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 2. Extract files to your web directory >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 3. **IMPORTANT: Change passwords in backend/.env** >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 4. Install Node.js dependencies: `cd backend ^&^& npm install --production` >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 5. Start backend: `node dist/src/main.js` or `pm2 start ecosystem.config.js` >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🔒 Security Features >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Enhanced security headers in .htaccess >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - SQL injection and XSS protection >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Rate limiting enabled >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Secure JWT configuration >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - CORS protection >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - File access restrictions >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## ⚠️ CRITICAL SECURITY >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo **BEFORE GOING LIVE:** >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 1. Change JWT_SECRET in backend/.env to a strong, unique value >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 2. Change database password >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 3. Update CORS_ORIGIN to your actual domain >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 4. Enable HTTPS/SSL on your server >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 5. Consider using the enhanced security package in /security/ folder >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 📁 Package Structure >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `frontend/` - React application (place in web root) >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `backend/` - Node.js API server >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `security/` - Enhanced security configurations (optional) >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🌐 URLs >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Frontend: https://kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - API: https://kasuf.xyz/api >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Health Check: https://kasuf.xyz/api/health >> "%DEPLOY_PACKAGE_DIR%\README.md"

echo [INFO] Creating archive: %ARCHIVE_NAME%...
echo [INFO] Using PowerShell to create ZIP archive...
powershell -Command "Compress-Archive -Path '%DEPLOY_PACKAGE_DIR%\*' -DestinationPath '%PROJECT_ROOT%%ARCHIVE_NAME%' -Force"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create archive using PowerShell.
    goto :error
)

REM Get archive size
for %%A in ("%PROJECT_ROOT%%ARCHIVE_NAME%") do set "ARCHIVE_SIZE=%%~zA"
set /a "ARCHIVE_SIZE_MB=%ARCHIVE_SIZE% / 1048576"

echo [OK] Archive created successfully: %PROJECT_ROOT%%ARCHIVE_NAME%
echo [INFO] Archive size: %ARCHIVE_SIZE_MB% MB
echo.

REM ================================================================
echo.
echo ================================================================
echo  🎉 SECURE BUILD COMPLETED SUCCESSFULLY! 🎉
echo ================================================================
echo.
echo 📦 Archive: %PROJECT_ROOT%%ARCHIVE_NAME%
echo 💾 Size: %ARCHIVE_SIZE_MB% MB
echo 🛡️  Security: Enhanced with security features
echo 📖 Docs: README.md included in package
echo.
echo 🔒 SECURITY ENHANCEMENTS INCLUDED:
echo   ✅ Secure HTTP headers (.htaccess)
echo   ✅ SQL injection protection
echo   ✅ XSS attack prevention
echo   ✅ Rate limiting configuration
echo   ✅ CORS protection
echo   ✅ File access restrictions
echo   ✅ Secure JWT settings
echo   ✅ Attack pattern blocking
echo.
echo ⚠️  BEFORE DEPLOYMENT:
echo   1. Change JWT_SECRET in backend/.env
echo   2. Change database password
echo   3. Update CORS_ORIGIN domain
echo   4. Setup HTTPS/SSL
echo.
echo 📁 Enhanced security package available in /security/ folder
echo 📖 Check README.md for full deployment instructions
echo.
echo ================================================================
goto :end

:error
echo.
echo ================================================================
echo  ❌ BUILD FAILED!
echo ================================================================
echo.
echo Please check the error messages above and fix the issues.
echo.
pause

:end
endlocal
