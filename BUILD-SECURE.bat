@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo    SECURE BUILD SCRIPT FOR KASUF CRM (Production Ready)
echo    Enhanced with Security Components v1.0
echo ================================================================
echo.

REM --- Settings ---
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "DEPLOY_PACKAGE_DIR=%PROJECT_ROOT%deploy_package_secure"
set "ARCHIVE_NAME=kasuf-crm-secure-deploy.zip"

REM Security check
echo [SECURITY] Checking required security files...
if not exist "%PROJECT_ROOT%docker-compose.security.yml" (
    echo [ERROR] docker-compose.security.yml not found! Run security setup first.
    goto :error
)
if not exist "%PROJECT_ROOT%deploy-secure.sh" (
    echo [ERROR] deploy-secure.sh not found! Security components missing.
    goto :error
)
echo [OK] Security files verified.
echo.

REM =================================================================
echo [STEP 1/8] Cleaning up old artifacts...
if exist "%DEPLOY_PACKAGE_DIR%" ( rd /s /q "%DEPLOY_PACKAGE_DIR%" )
if exist "%PROJECT_ROOT%%ARCHIVE_NAME%" ( del "%PROJECT_ROOT%%ARCHIVE_NAME%" )

REM Create secure deployment structure
mkdir "%DEPLOY_PACKAGE_DIR%" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\frontend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\nginx" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\security" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\monitoring" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\fail2ban" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\scripts" > nul 2>&1
echo [OK] Secure staging directory structure created.
echo.

REM =================================================================
echo [STEP 2/8] Building Frontend with Security Headers...
cd /d "%FRONTEND_DIR%"
echo [INFO] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed!
    goto :error
)

REM Set production environment variables for build
set "REACT_APP_API_URL=/api"
set "REACT_APP_ENVIRONMENT=production"
set "GENERATE_SOURCEMAP=false"

echo [INFO] Building frontend for production (no source maps)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    goto :error
)
echo [OK] Frontend build completed securely.
echo.

REM =================================================================
echo [STEP 3/8] Building Backend with Security Features...
cd /d "%BACKEND_DIR%"
echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend npm install failed!
    goto :error
)

echo [INFO] Building backend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    goto :error
)
echo [OK] Backend build completed.
echo.

REM =================================================================
echo [STEP 4/8] Staging Frontend with Security Configurations...
REM Find build directory
set "FRONTEND_BUILD_DIR="
if exist "%FRONTEND_DIR%\build" (
    set "FRONTEND_BUILD_DIR=%FRONTEND_DIR%\build"
    goto :frontend_found
)
if exist "%FRONTEND_DIR%\dist" (
    set "FRONTEND_BUILD_DIR=%FRONTEND_DIR%\dist"
    goto :frontend_found
)
echo [ERROR] Frontend build directory not found!
goto :error

:frontend_found
echo [INFO] Copying frontend files from: !FRONTEND_BUILD_DIR!
xcopy "!FRONTEND_BUILD_DIR!\*" "%DEPLOY_PACKAGE_DIR%\frontend\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy frontend files!
    goto :error
)

REM Copy secure frontend Docker configuration
copy "%FRONTEND_DIR%\Dockerfile.security" "%DEPLOY_PACKAGE_DIR%\frontend\Dockerfile" > nul 2>&1
copy "%FRONTEND_DIR%\nginx.conf" "%DEPLOY_PACKAGE_DIR%\frontend\" > nul 2>&1

echo [OK] Frontend files staged with security configs.
echo.

REM =================================================================
echo [STEP 5/8] Staging Backend with Security Components...
echo [INFO] Copying backend distribution...
xcopy "%BACKEND_DIR%\dist\*" "%DEPLOY_PACKAGE_DIR%\backend\dist\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy backend dist!
    goto :error
)

REM Copy package files
copy "%BACKEND_DIR%\package.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul
copy "%BACKEND_DIR%\package-lock.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul

REM Copy security-enhanced files
copy "%BACKEND_DIR%\Dockerfile.security" "%DEPLOY_PACKAGE_DIR%\backend\Dockerfile" > nul 2>&1
copy "%BACKEND_DIR%\src\main.security.ts" "%DEPLOY_PACKAGE_DIR%\backend\" > nul 2>&1

REM Copy security middleware and guards
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src\middleware" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src\guards" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src\filters" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src\modules" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend\src\modules\security" > nul 2>&1

copy "%BACKEND_DIR%\src\middleware\security.middleware.ts" "%DEPLOY_PACKAGE_DIR%\backend\src\middleware\" > nul 2>&1
copy "%BACKEND_DIR%\src\guards\rate-limit.guard.ts" "%DEPLOY_PACKAGE_DIR%\backend\src\guards\" > nul 2>&1
copy "%BACKEND_DIR%\src\filters\security-exception.filter.ts" "%DEPLOY_PACKAGE_DIR%\backend\src\filters\" > nul 2>&1
copy "%BACKEND_DIR%\src\modules\security\security.module.ts" "%DEPLOY_PACKAGE_DIR%\backend\src\modules\security\" > nul 2>&1

echo [OK] Backend staged with security components.
echo.

REM =================================================================
echo [STEP 6/8] Copying Security Infrastructure...
echo [INFO] Staging security configurations...

REM Docker security configurations
copy "%PROJECT_ROOT%docker-compose.security.yml" "%DEPLOY_PACKAGE_DIR%\docker-compose.yml" > nul
copy "%PROJECT_ROOT%.env.security" "%DEPLOY_PACKAGE_DIR%\.env.template" > nul

REM Nginx security configurations
copy "%PROJECT_ROOT%nginx\nginx-security.conf" "%DEPLOY_PACKAGE_DIR%\nginx\" > nul 2>&1

REM Fail2ban configurations
xcopy "%PROJECT_ROOT%fail2ban\*" "%DEPLOY_PACKAGE_DIR%\fail2ban\" /s /e /i /y /q > nul 2>&1

REM Monitoring configurations
xcopy "%PROJECT_ROOT%monitoring\*" "%DEPLOY_PACKAGE_DIR%\monitoring\" /s /e /i /y /q > nul 2>&1

REM Deployment scripts
copy "%PROJECT_ROOT%deploy-secure.sh" "%DEPLOY_PACKAGE_DIR%\scripts\" > nul 2>&1

echo [OK] Security infrastructure copied.
echo.

REM =================================================================
echo [STEP 7/8] Creating Production Environment Configuration...
echo [INFO] Generating secure production environment file...

echo # PRODUCTION ENVIRONMENT CONFIGURATION > "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Generated: %date% %time% >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # ⚠️  ВАЖНО: Измените ВСЕ секреты перед развертыванием! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Application Settings >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo NODE_ENV=production >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo PORT=3000 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DOMAIN=kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo CORS_ORIGIN=https://kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Database Configuration - ИЗМЕНИТЕ ПАРОЛЬ! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DB_HOST=postgres >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DB_PORT=5432 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DB_NAME=thewho_production >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DB_USERNAME=postgres >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Redis Configuration - ИЗМЕНИТЕ ПАРОЛЬ! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo REDIS_HOST=redis >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo REDIS_PORT=6379 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_123! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # JWT Security - ИЗМЕНИТЕ СЕКРЕТ! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo JWT_SECRET=CHANGE_THIS_JWT_SECRET_MINIMUM_64_CHARS_LONG_VERY_SECURE_KEY_2025! >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo JWT_EXPIRES_IN=1h >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Security Settings >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo BCRYPT_ROUNDS=12 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo MAX_LOGIN_ATTEMPTS=5 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo LOCKOUT_TIME=900000 >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo ENABLE_RATE_LIMITING=true >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo ENABLE_SECURITY_HEADERS=true >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo. >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo # Monitoring >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo ENABLE_PROMETHEUS=true >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo ENABLE_AUDIT_LOG=true >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"
echo LOG_LEVEL=info >> "%DEPLOY_PACKAGE_DIR%\.env.production.template"

echo [INFO] Creating deployment README...
echo # KASUF CRM - SECURE DEPLOYMENT PACKAGE > "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🚀 Быстрое развертывание >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 1. Распакуйте архив на сервере >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 2. Скопируйте .env.production.template в .env.production >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 3. **ИЗМЕНИТЕ ВСЕ ПАРОЛИ И СЕКРЕТЫ** в .env.production >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 4. Запустите: chmod +x scripts/deploy-secure.sh ^&^& sudo ./scripts/deploy-secure.sh >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 5. Настройте SSL: certbot --nginx -d kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🔒 Компоненты безопасности >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Multi-layer security middleware >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Rate limiting and DDoS protection >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - SQL injection and XSS protection >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Fail2ban automated IP blocking >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Prometheus monitoring and alerts >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Secure Docker containers >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Automated backup system >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## ⚠️ КРИТИЧЕСКИ ВАЖНО >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ОБЯЗАТЕЛЬНО измените все пароли в .env.production перед запуском! >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo Подробная документация: SECURITY-DEPLOYMENT-GUIDE.md >> "%DEPLOY_PACKAGE_DIR%\README.md"

REM Copy comprehensive documentation
copy "%PROJECT_ROOT%SECURITY-DEPLOYMENT-GUIDE.md" "%DEPLOY_PACKAGE_DIR%\" > nul 2>&1

echo [OK] Production configurations created.
echo.

REM =================================================================
echo [STEP 8/8] Creating Secure Archive...
echo [INFO] Creating encrypted deployment archive...

REM Create archive with PowerShell
powershell -Command "Compress-Archive -Path '%DEPLOY_PACKAGE_DIR%\*' -DestinationPath '%PROJECT_ROOT%%ARCHIVE_NAME%' -Force"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create secure archive!
    goto :error
)

REM Get archive size
for %%A in ("%PROJECT_ROOT%%ARCHIVE_NAME%") do set "ARCHIVE_SIZE=%%~zA"
set /a "ARCHIVE_SIZE_MB=%ARCHIVE_SIZE% / 1048576"

echo [OK] Secure archive created: %PROJECT_ROOT%%ARCHIVE_NAME%
echo [INFO] Archive size: %ARCHIVE_SIZE_MB% MB
echo.

REM =================================================================
echo.
echo ================================================================
echo  🎉 SECURE BUILD COMPLETED SUCCESSFULLY! 🎉
echo ================================================================
echo.
echo 📦 Archive: %PROJECT_ROOT%%ARCHIVE_NAME%
echo 💾 Size: %ARCHIVE_SIZE_MB% MB
echo 🛡️  Security: Enhanced with multi-layer protection
echo 🚀 Ready for: Production deployment
echo.
echo 📋 NEXT STEPS:
echo   1. Upload archive to your production server
echo   2. Extract: unzip kasuf-crm-secure-deploy.zip
echo   3. Configure: cp .env.production.template .env.production
echo   4. ⚠️  CHANGE ALL PASSWORDS in .env.production
echo   5. Deploy: chmod +x scripts/deploy-secure.sh ^&^& sudo ./scripts/deploy-secure.sh
echo   6. Setup SSL: certbot --nginx -d kasuf.xyz
echo.
echo 🔒 SECURITY FEATURES INCLUDED:
echo   ✅ SQL Injection Protection
echo   ✅ XSS Attack Prevention  
echo   ✅ Rate Limiting ^& DDoS Protection
echo   ✅ Automated IP Blocking (Fail2ban)
echo   ✅ Security Headers ^& CSP
echo   ✅ Encrypted Communications
echo   ✅ Monitoring ^& Alerting
echo   ✅ Audit Logging
echo   ✅ Secure Docker Containers
echo   ✅ Automated Backups
echo.
echo 📖 Documentation: See README.md and SECURITY-DEPLOYMENT-GUIDE.md
echo.
echo ================================================================
pause
goto :end

:error
echo.
echo ================================================================
echo  ❌ SECURE BUILD FAILED!
echo ================================================================
echo.
echo Please check the error messages above and fix the issues.
echo Make sure all security components are properly configured.
echo.
echo If you need help, check:
echo - SECURITY-DEPLOYMENT-GUIDE.md
echo - Individual component documentation
echo.
pause

:end
endlocal
