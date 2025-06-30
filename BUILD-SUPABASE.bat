@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo    KASUF CRM - SUPABASE BUILD SCRIPT
echo    Secure build with Supabase database integration
echo ================================================================
echo.

REM --- Settings ---
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "DEPLOY_PACKAGE_DIR=%PROJECT_ROOT%deploy_package_supabase"
set "ARCHIVE_NAME=kasuf-crm-supabase-deploy.zip"

REM =================================================================
echo [STEP 1/7] Cleaning up old artifacts...
if exist "%DEPLOY_PACKAGE_DIR%" ( rd /s /q "%DEPLOY_PACKAGE_DIR%" )
if exist "%PROJECT_ROOT%%ARCHIVE_NAME%" ( del "%PROJECT_ROOT%%ARCHIVE_NAME%" )

mkdir "%DEPLOY_PACKAGE_DIR%" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\frontend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\backend" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\nginx" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\security" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\monitoring" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\fail2ban" > nul 2>&1
mkdir "%DEPLOY_PACKAGE_DIR%\scripts" > nul 2>&1

echo [OK] Supabase deployment structure created.
echo.

REM =================================================================
echo [STEP 2/7] Building Frontend...
cd /d "%FRONTEND_DIR%"
echo [INFO] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend npm install failed!
    goto :error
)

set "REACT_APP_API_URL=/api"
set "REACT_APP_ENVIRONMENT=production"
set "GENERATE_SOURCEMAP=false"

echo [INFO] Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    goto :error
)
echo [OK] Frontend build completed.
echo.

REM =================================================================
echo [STEP 3/7] Building Backend...
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
echo [STEP 4/7] Staging Frontend...
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
echo [INFO] Copying frontend files...
xcopy "!FRONTEND_BUILD_DIR!\*" "%DEPLOY_PACKAGE_DIR%\frontend\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy frontend files!
    goto :error
)

copy "%FRONTEND_DIR%\Dockerfile.security" "%DEPLOY_PACKAGE_DIR%\frontend\Dockerfile" > nul 2>&1
copy "%FRONTEND_DIR%\nginx.conf" "%DEPLOY_PACKAGE_DIR%\frontend\" > nul 2>&1
echo [OK] Frontend staged.
echo.

REM =================================================================
echo [STEP 5/7] Staging Backend with Supabase Configuration...
echo [INFO] Copying backend files...
xcopy "%BACKEND_DIR%\dist\*" "%DEPLOY_PACKAGE_DIR%\backend\dist\" /s /e /i /y /q > nul
if %errorlevel% gtr 0 (
    echo [ERROR] Failed to copy backend dist!
    goto :error
)

copy "%BACKEND_DIR%\package.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul
copy "%BACKEND_DIR%\package-lock.json" "%DEPLOY_PACKAGE_DIR%\backend\" > nul
copy "%BACKEND_DIR%\Dockerfile.security" "%DEPLOY_PACKAGE_DIR%\backend\Dockerfile" > nul 2>&1

REM Copy Supabase configuration
copy "%BACKEND_DIR%\ormconfig.supabase.ts" "%DEPLOY_PACKAGE_DIR%\backend\" > nul 2>&1

REM Copy security components
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

echo [OK] Backend staged with Supabase support.
echo.

REM =================================================================
echo [STEP 6/7] Copying Supabase Infrastructure...
echo [INFO] Staging Supabase configurations...

REM Docker configuration for Supabase
copy "%PROJECT_ROOT%docker-compose.supabase.yml" "%DEPLOY_PACKAGE_DIR%\docker-compose.yml" > nul
copy "%PROJECT_ROOT%.env.supabase.production" "%DEPLOY_PACKAGE_DIR%\.env.production.template" > nul

REM Nginx security configurations
copy "%PROJECT_ROOT%nginx\nginx-security.conf" "%DEPLOY_PACKAGE_DIR%\nginx\" > nul 2>&1

REM Security components
xcopy "%PROJECT_ROOT%fail2ban\*" "%DEPLOY_PACKAGE_DIR%\fail2ban\" /s /e /i /y /q > nul 2>&1
xcopy "%PROJECT_ROOT%monitoring\*" "%DEPLOY_PACKAGE_DIR%\monitoring\" /s /e /i /y /q > nul 2>&1
copy "%PROJECT_ROOT%deploy-secure.sh" "%DEPLOY_PACKAGE_DIR%\scripts\" > nul 2>&1

REM Supabase documentation
copy "%PROJECT_ROOT%SUPABASE-SETUP.md" "%DEPLOY_PACKAGE_DIR%\" > nul 2>&1

echo [OK] Supabase infrastructure copied.
echo.

REM =================================================================
echo [STEP 7/7] Creating Supabase Deployment Package...
echo [INFO] Creating deployment documentation...

echo # KASUF CRM - SUPABASE DEPLOYMENT PACKAGE > "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## Generated: %date% %time% >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🗄️ Supabase Database Integration >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo This package is configured to work with Supabase as the database provider. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo **Database Configuration:** >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Host: aws-0-eu-central-1.pooler.supabase.com >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Port: 6543 >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Database: postgres >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Username: postgres.kukqacmzfmzepdfddppl >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🚀 Quick Deployment >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 1. Extract this package on your server >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 2. Copy .env.production.template to .env.production >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 3. **CRITICAL: Edit .env.production and set your Supabase password** >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 4. Set your Supabase API keys (SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 5. Change all security secrets (JWT_SECRET, etc.) >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 6. Run: chmod +x scripts/deploy-secure.sh ^&^& sudo ./scripts/deploy-secure.sh >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 7. Setup SSL: certbot --nginx -d kasuf.xyz >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## ⚠️ CRITICAL CONFIGURATION >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo **BEFORE DEPLOYMENT, YOU MUST:** >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 1. Replace [YOUR-PASSWORD] with your actual Supabase password >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 2. Get your Supabase API keys from Settings -^> API in Supabase dashboard >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 3. Change all JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY values >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo 4. Update CORS_ORIGIN to your actual domain >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 🔒 Security Features >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - SSL/TLS encryption for Supabase connections >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Connection pooling and timeout management >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Multi-layer application security >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Rate limiting and DDoS protection >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - SQL injection and XSS prevention >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Automated security monitoring >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Fail2ban IP blocking >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 📁 Package Structure >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `docker-compose.yml` - Supabase-optimized Docker configuration >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `.env.production.template` - Supabase environment template >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `SUPABASE-SETUP.md` - Detailed Supabase setup instructions >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - `backend/ormconfig.supabase.ts` - TypeORM configuration for Supabase >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo ## 📖 Documentation >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - See SUPABASE-SETUP.md for detailed configuration instructions >> "%DEPLOY_PACKAGE_DIR%\README.md"
echo - Check SECURITY-DEPLOYMENT-GUIDE.md for security best practices >> "%DEPLOY_PACKAGE_DIR%\README.md"

echo [INFO] Creating Supabase environment checklist...
echo # SUPABASE DEPLOYMENT CHECKLIST > "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo ## Before Deployment >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Set DB_PASSWORD in .env.production >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Set SUPABASE_ANON_KEY in .env.production >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Set SUPABASE_SERVICE_ROLE_KEY in .env.production >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Change JWT_SECRET (minimum 64 characters) >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Change SESSION_SECRET >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Change ENCRYPTION_KEY >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Change API_SECRET_KEY >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Update CORS_ORIGIN to your domain >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Update DOMAIN and EMAIL for SSL >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo ## Supabase Setup >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Verify Supabase project is accessible >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Enable Row Level Security (RLS) on tables >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Configure network restrictions in Supabase >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Test database connection from server >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo ## After Deployment >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo. >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Test application startup >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Check database connectivity >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Verify SSL certificates >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Test API endpoints >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Check security monitoring >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"
echo - [ ] Verify backup strategy >> "%DEPLOY_PACKAGE_DIR%\DEPLOYMENT-CHECKLIST.md"

echo [INFO] Creating archive...
powershell -Command "Compress-Archive -Path '%DEPLOY_PACKAGE_DIR%\*' -DestinationPath '%PROJECT_ROOT%%ARCHIVE_NAME%' -Force"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create archive!
    goto :error
)

for %%A in ("%PROJECT_ROOT%%ARCHIVE_NAME%") do set "ARCHIVE_SIZE=%%~zA"
set /a "ARCHIVE_SIZE_MB=%ARCHIVE_SIZE% / 1048576"

echo [OK] Supabase deployment package created!
echo.

echo ================================================================
echo  🎉 SUPABASE BUILD COMPLETED SUCCESSFULLY! 🎉
echo ================================================================
echo.
echo 📦 Archive: %PROJECT_ROOT%%ARCHIVE_NAME%
echo 💾 Size: %ARCHIVE_SIZE_MB% MB
echo 🗄️  Database: Supabase Integration
echo 🛡️  Security: Enterprise-grade protection
echo.
echo 🔑 YOUR SUPABASE DATABASE:
echo   Host: aws-0-eu-central-1.pooler.supabase.com
echo   Port: 6543
echo   Database: postgres
echo   Username: postgres.kukqacmzfmzepdfddppl
echo   ⚠️  Password: MUST BE SET IN .env.production
echo.
echo 📋 NEXT STEPS:
echo   1. Upload package to your server
echo   2. Extract: unzip kasuf-crm-supabase-deploy.zip
echo   3. Configure: cp .env.production.template .env.production
echo   4. ⚠️  CRITICAL: Set your Supabase password in .env.production
echo   5. Get Supabase API keys from your dashboard
echo   6. Change all security secrets
echo   7. Deploy: chmod +x scripts/deploy-secure.sh ^&^& sudo ./scripts/deploy-secure.sh
echo.
echo 🗄️ SUPABASE FEATURES:
echo   ✅ SSL/TLS encrypted connections
echo   ✅ Connection pooling optimization
echo   ✅ Transaction-level pooling
echo   ✅ Automatic failover support
echo   ✅ Built-in backup and recovery
echo   ✅ Real-time subscriptions ready
echo   ✅ Row Level Security support
echo.
echo 📖 DOCUMENTATION:
echo   - README.md - Quick start guide
echo   - SUPABASE-SETUP.md - Detailed configuration
echo   - DEPLOYMENT-CHECKLIST.md - Step-by-step checklist
echo.
echo ================================================================
pause
goto :end

:error
echo.
echo ================================================================
echo  ❌ SUPABASE BUILD FAILED!
echo ================================================================
echo.
echo Please check the error messages above.
echo Make sure all dependencies are installed and Supabase is accessible.
echo.
pause

:end
endlocal
