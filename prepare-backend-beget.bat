@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: SCRIPT FOR PREPARING BACKEND ZIP FOR BEGET DEPLOYMENT
:: =================================================================

echo ====================================================================
echo PREPARING BACKEND FOR BEGET DEPLOYMENT
echo ====================================================================

set "BASE_DIR=%~dp0"
set "BACKEND_DIR=%BASE_DIR%backend"
set "TEMP_DIR=%BASE_DIR%temp-backend-beget"
set "ZIP_NAME=backend-beget.zip"
set "ZIP_PATH=%BASE_DIR%!ZIP_NAME!"

:: Check if backend directory exists
if not exist "!BACKEND_DIR!" (
    echo ERROR: Backend directory not found: !BACKEND_DIR!
    pause
    exit /b 1
)

echo Step 1: Cleaning previous build artifacts...
if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!"
if exist "!ZIP_PATH!" del "!ZIP_PATH!"

echo Step 2: Creating temporary directory...
mkdir "!TEMP_DIR!"

echo Step 3: Installing backend dependencies...
cd /d "!BACKEND_DIR!"
if exist node_modules rmdir /s /q node_modules
call npm install --production --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo Step 4: Building backend for production...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Failed to build backend
    pause
    exit /b 1
)

echo Step 5: Copying necessary files to temp directory...

:: Core application files
xcopy "!BACKEND_DIR!\dist" "!TEMP_DIR!\dist" /E /I /Y
xcopy "!BACKEND_DIR!\src" "!TEMP_DIR!\src" /E /I /Y
xcopy "!BACKEND_DIR!\node_modules" "!TEMP_DIR!\node_modules" /E /I /Y

:: Configuration files
copy "!BACKEND_DIR!\package.json" "!TEMP_DIR!\"
copy "!BACKEND_DIR!\package-lock.json" "!TEMP_DIR!\"
copy "!BACKEND_DIR!\tsconfig.json" "!TEMP_DIR!\"
copy "!BACKEND_DIR!\ormconfig.ts" "!TEMP_DIR!\"

:: Beget-specific configurations
if exist "!BACKEND_DIR!\ormconfig.beget.ts" copy "!BACKEND_DIR!\ormconfig.beget.ts" "!TEMP_DIR!\"
if exist "!BACKEND_DIR!\Dockerfile.beget" copy "!BACKEND_DIR!\Dockerfile.beget" "!TEMP_DIR!\Dockerfile"
if exist "!BACKEND_DIR!\.env.production" copy "!BACKEND_DIR!\.env.production" "!TEMP_DIR!\"

:: Project root environment files
if exist "!BASE_DIR!\.env.beget" copy "!BASE_DIR!\.env.beget" "!TEMP_DIR!\.env"
if exist "!BASE_DIR!\.env.production" copy "!BASE_DIR!\.env.production" "!TEMP_DIR!\"

:: Uploads directory (if exists)
if exist "!BACKEND_DIR!\uploads" (
    xcopy "!BACKEND_DIR!\uploads" "!TEMP_DIR!\uploads" /E /I /Y
) else (
    mkdir "!TEMP_DIR!\uploads"
)

:: SQL scripts and database files
if exist "!BACKEND_DIR!\*.sql" copy "!BACKEND_DIR!\*.sql" "!TEMP_DIR!\"

:: Create startup script for Beget
echo Creating startup script for Beget...
(
echo #!/bin/bash
echo # Backend startup script for Beget
echo echo "Starting Production CRM Backend..."
echo export NODE_ENV=production
echo cd /app
echo npm run start:prod
) > "!TEMP_DIR!\start.sh"

:: Create ecosystem.config.js for PM2 if needed
(
echo module.exports = {
echo   apps: [{
echo     name: 'crm-backend',
echo     script: 'dist/src/main.js',
echo     instances: 1,
echo     autorestart: true,
echo     watch: false,
echo     max_memory_restart: '512M',
echo     env: {
echo       NODE_ENV: 'production',
echo       PORT: 3001
echo     }
echo   }]
echo };
) > "!TEMP_DIR!\ecosystem.config.js"

echo Step 6: Creating deployment README...
(
echo # Backend Deployment Guide for Beget
echo.
echo ## Quick Start
echo 1. Extract this archive to your server
echo 2. Copy .env.beget to .env and configure your settings
echo 3. Run: npm install --production
echo 4. Run: npm run start:prod
echo.
echo ## Environment Variables
echo - Configure database settings in .env file
echo - Set JWT_SECRET to a secure random string
echo - Set CORS_ORIGIN to your domain
echo.
echo ## Files Included
echo - dist/ - Compiled TypeScript code
echo - src/ - Source code
echo - node_modules/ - Dependencies
echo - uploads/ - File upload directory
echo - *.sql - Database scripts
echo.
echo ## API Endpoints
echo - Health check: GET /health
echo - API documentation: GET /api/docs
echo - Main API: /api/*
echo.
echo ## Troubleshooting
echo - Check logs in console output
echo - Verify database connection
echo - Ensure all environment variables are set
echo - Check port 3001 is available
) > "!TEMP_DIR!\README-DEPLOYMENT.md"

echo Step 7: Creating ZIP archive...
cd /d "!BASE_DIR!"

:: Use PowerShell to create ZIP (more reliable than 7zip dependency)
powershell -command "Compress-Archive -Path '!TEMP_DIR!\*' -DestinationPath '!ZIP_PATH!' -Force"

if !errorlevel! equ 0 (
    echo SUCCESS: Backend ZIP created successfully!
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

echo Step 8: Cleaning up temporary files...
if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!"

echo ====================================================================
echo BACKEND DEPLOYMENT PACKAGE READY!
echo ====================================================================
echo.
echo Archive: !ZIP_PATH!
echo.
echo Next steps:
echo 1. Upload !ZIP_NAME! to your Beget server
echo 2. Extract the archive: unzip !ZIP_NAME!
echo 3. Configure environment: cp .env.beget .env
echo 4. Install dependencies: npm install --production
echo 5. Start the application: npm run start:prod
echo.
echo IMPORTANT: 
echo - Configure your database settings in .env file
echo - Set secure JWT_SECRET
echo - Update CORS_ORIGIN to your domain
echo - Ensure port 3001 is available
echo.
pause
