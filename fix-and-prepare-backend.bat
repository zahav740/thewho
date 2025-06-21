@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: FIX BACKEND DEPENDENCIES AND PREPARE FOR BEGET
:: =================================================================

echo ====================================================================
echo FIXING DEPENDENCIES AND PREPARING BACKEND FOR BEGET
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
if exist node_modules rmdir /s /q node_modules

echo Step 2: Installing missing dependencies...
call npm install dayjs --save
if !errorlevel! neq 0 (
    echo ERROR: Failed to install dayjs
    pause
    exit /b 1
)

echo Step 3: Installing all dependencies...
call npm install --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Step 4: Building backend...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Failed to build backend
    echo.
    echo Checking for compilation errors...
    call npm run build
    echo.
    echo Please fix the TypeScript errors above and try again.
    pause
    exit /b 1
)

echo Step 5: Installing production dependencies only...
rmdir /s /q node_modules
call npm install --production --silent
if !errorlevel! neq 0 (
    echo ERROR: Failed to install production dependencies
    pause
    exit /b 1
)

echo Step 6: Creating ZIP archive...
cd /d "!BASE_DIR!"

:: Create ZIP using PowerShell
powershell -command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('!BACKEND_DIR!', '!ZIP_PATH!')"

if !errorlevel! equ 0 (
    echo ====================================================================
    echo SUCCESS: Backend ZIP created!
    echo ====================================================================
    echo File: !ZIP_PATH!
    
    :: Get file size
    for %%A in ("!ZIP_PATH!") do set "file_size=%%~zA"
    set /a "file_size_mb=!file_size! / 1024 / 1024"
    echo Size: !file_size_mb! MB
    
    echo.
    echo DEPLOYMENT INSTRUCTIONS:
    echo 1. Upload !ZIP_NAME! to your Beget server
    echo 2. Extract: unzip !ZIP_NAME!
    echo 3. Configure .env with your database settings
    echo 4. Run: npm install --production
    echo 5. Run: npm run start:prod
    echo.
    echo The backend will be available on port 3001
) else (
    echo ERROR: Failed to create ZIP
    pause
    exit /b 1
)

echo.
pause
