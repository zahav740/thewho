@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: FRONTEND PREPARATION SCRIPT FOR BEGET DEPLOYMENT
:: =================================================================

echo ====================================================================
echo PREPARING FRONTEND FOR BEGET DEPLOYMENT
echo ====================================================================

set "BASE_DIR=%~dp0"
set "FRONTEND_DIR=%BASE_DIR%frontend"
set "ZIP_NAME=frontend-beget.zip"
set "ZIP_PATH=%BASE_DIR%!ZIP_NAME!"

:: Check if frontend directory exists
if not exist "!FRONTEND_DIR!" (
    echo ERROR: Frontend directory not found: !FRONTEND_DIR!
    pause
    exit /b 1
)

echo Step 1: Cleaning previous build...
cd /d "!FRONTEND_DIR!"
if exist "!ZIP_PATH!" del "!ZIP_PATH!"
if exist build rmdir /s /q build

echo Step 2: Installing dependencies...
if exist node_modules rmdir /s /q node_modules
call npm install --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Step 3: Creating production environment file...
(
echo REACT_APP_API_URL=https://your-domain.beget.tech/api
echo REACT_APP_ENVIRONMENT=production
echo GENERATE_SOURCEMAP=false
echo SKIP_PREFLIGHT_CHECK=true
) > .env.production

echo Step 4: Building frontend for production...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Failed to build frontend
    echo.
    echo Please check for any compilation errors and try again.
    pause
    exit /b 1
)

echo Step 5: Creating ZIP archive with build files...
cd /d "!BASE_DIR!"

:: Create ZIP only with build directory contents
powershell -command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('!FRONTEND_DIR!\build', '!ZIP_PATH!')"

if !errorlevel! equ 0 (
    echo ====================================================================
    echo SUCCESS: Frontend ZIP created!
    echo ====================================================================
    echo File: !ZIP_PATH!
    
    :: Get file size
    for %%A in ("!ZIP_PATH!") do set "file_size=%%~zA"
    set /a "file_size_mb=!file_size! / 1024 / 1024"
    echo Size: !file_size_mb! MB
    
    echo.
    echo DEPLOYMENT INSTRUCTIONS:
    echo 1. Upload !ZIP_NAME! to your Beget server
    echo 2. Extract to your web directory: unzip !ZIP_NAME!
    echo 3. Make sure your web server points to the extracted files
    echo 4. Update API URL in your backend .env file
    echo.
    echo The frontend files are ready for static hosting
) else (
    echo ERROR: Failed to create ZIP
    pause
    exit /b 1
)

:: Clean up
if exist "!FRONTEND_DIR!\.env.production" del "!FRONTEND_DIR!\.env.production"

echo.
pause
