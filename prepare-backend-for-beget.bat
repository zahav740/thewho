@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: BACKEND PREPARATION SCRIPT FOR BEGET DEPLOYMENT
:: =================================================================

echo ====================================================================
echo PREPARING BACKEND FOR BEGET DEPLOYMENT
echo ====================================================================

set "BASE_DIR=%~dp0"
set "BACKEND_DIR=%BASE_DIR%backend"
set "ZIP_NAME=backend-beget.zip"
set "ZIP_PATH=%BASE_DIR%!ZIP_NAME!"

:: Check if backend directory exists
if not exist "!BACKEND_DIR!" (
    echo ERROR: Backend directory not found: !BACKEND_DIR!
    pause
    exit /b 1
)

echo Step 1: Cleaning previous build...
cd /d "!BACKEND_DIR!"
if exist "!ZIP_PATH!" del "!ZIP_PATH!"
if exist dist rmdir /s /q dist

echo Step 2: Installing ALL dependencies (including dev dependencies for build)...
if exist node_modules rmdir /s /q node_modules
call npm install --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Step 3: Building backend...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Failed to build backend
    echo.
    echo This usually means there are TypeScript compilation errors.
    echo Please fix the errors and try again.
    echo.
    pause
    exit /b 1
)

echo Step 4: Installing production dependencies only...
rmdir /s /q node_modules
call npm install --production --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install production dependencies
    pause
    exit /b 1
)

echo Step 5: Creating ZIP archive...
cd /d "!BASE_DIR!"

:: Create ZIP using PowerShell
powershell -command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('!BACKEND_DIR!', '!ZIP_PATH!')"

if !errorlevel! equ 0 (
    echo SUCCESS: Backend ZIP created!
    echo File: !ZIP_PATH!
    
    :: Get file size
    for %%A in ("!ZIP_PATH!") do set "file_size=%%~zA"
    set /a "file_size_mb=!file_size! / 1024 / 1024"
    echo Size: !file_size_mb! MB
    
    echo.
    echo Upload this file to your Beget server and extract it.
    echo.
    echo IMPORTANT:
    echo 1. Configure .env file with your database settings
    echo 2. Run: npm install --production
    echo 3. Run: npm run start:prod
) else (
    echo ERROR: Failed to create ZIP
    pause
    exit /b 1
)

echo.
pause
