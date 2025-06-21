@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: QUICK FIX AND PREPARE BOTH BACKEND AND FRONTEND FOR BEGET
:: =================================================================

echo ====================================================================
echo QUICK FIX AND PREPARE FOR BEGET DEPLOYMENT
echo ====================================================================

set "BASE_DIR=%~dp0"

echo Step 1: Fixing backend dependencies and preparing...
echo.
call "!BASE_DIR!fix-and-prepare-backend.bat"
if !errorlevel! neq 0 (
    echo ERROR: Backend preparation failed!
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo Step 2: Preparing frontend...
echo.
call "!BASE_DIR!prepare-frontend-for-beget.bat"
if !errorlevel! neq 0 (
    echo ERROR: Frontend preparation failed!
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo SUCCESS: BOTH PACKAGES READY FOR BEGET DEPLOYMENT
echo ====================================================================
echo.
echo Created files:
echo - backend-beget.zip (complete backend with dependencies)
echo - frontend-beget.zip (production build files)
echo.
echo DEPLOYMENT STEPS:
echo.
echo FOR BACKEND:
echo 1. Upload backend-beget.zip to your server
echo 2. Extract: unzip backend-beget.zip
echo 3. Configure .env file with database settings
echo 4. Run: npm install --production
echo 5. Run: npm run start:prod
echo.
echo FOR FRONTEND:
echo 1. Upload frontend-beget.zip to web directory
echo 2. Extract: unzip frontend-beget.zip
echo 3. Point your domain to the extracted files
echo.
echo IMPORTANT:
echo - Backend will run on port 3001
echo - Frontend is static files for web server
echo - Update REACT_APP_API_URL in backend .env
echo - Set proper database credentials
echo.
pause
