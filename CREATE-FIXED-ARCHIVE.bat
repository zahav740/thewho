@echo off
echo ===============================================
echo URGENT FIX: LOGIN CENTERING ISSUE
echo ===============================================
echo Time: %date% %time%
echo.

cd frontend

echo Checking if files are properly fixed...
findstr "zIndex: 999999" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo.
    echo CRITICAL ERROR!
    echo LoginPage.tsx DOES NOT CONTAIN fixes!
    echo.
    echo File should contain:
    echo - rootContainerStyles
    echo - position: 'fixed'
    echo - zIndex: 999999
    echo.
    echo Please reload files from GitHub or repeat fixes.
    pause
    exit /b 1
) else (
    echo OK: LoginPage.tsx is PROPERLY FIXED
)

echo.
echo Cleaning all old files...
if exist build (
    echo Removing build...
    rmdir /s /q build
)
if exist node_modules\.cache (
    echo Clearing cache...
    rmdir /s /q node_modules\.cache
)

echo.
echo Creating PRODUCTION configuration...
echo # PRODUCTION CONFIG FOR KASUF.XYZ > .env
echo REACT_APP_API_URL=https://kasuf.xyz/api >> .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo.
echo Configuration created:
type .env

echo.
echo Building with fixed centering...
echo Setting environment variables...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

echo Starting build...
call npm run build

if not exist build (
    echo.
    echo BUILD FAILED!
    echo Check errors above and fix them.
    echo.
    pause
    exit /b 1
)

echo.
echo BUILD SUCCESSFUL!

echo.
echo Removing old archive...
if exist ..\frontend-production.zip (
    del ..\frontend-production.zip
    echo Old archive removed
)

echo.
echo Creating NEW archive with fixes...
cd build
powershell -NoLogo -Command "Write-Host 'Creating archive...'; Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force; Write-Host 'Archive created!'"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo ================================================
    echo SUCCESS! NEW ARCHIVE WITH FIXES CREATED!
    echo ================================================
    for %%F in (..\frontend-production.zip) do (
        echo Size: %%~zF bytes
        echo Created: %%~tF
    )
    echo.
    echo URGENTLY execute on Beget server:
    echo.
    echo 1. Upload frontend-production.zip to /var/upload/frontend/
    echo.
    echo 2. SSH commands:
    echo    cd /var/upload/frontend
    echo    pm2 stop crm-frontend
    echo    rm -rf build ^&^& mkdir build
    echo    unzip -o frontend-production.zip -d build/
    echo    pm2 restart crm-frontend
    echo.
    echo 3. Check https://kasuf.xyz/login
    echo    LOGIN SHOULD BE CENTERED!
    echo.
    echo WARNING: This archive contains NEW fixes
    echo    created %date% %time%
    echo.
) else (
    echo ERROR: Archive not created!
    pause
    exit /b 1
)

cd ..

echo.
echo ================================================
echo DONE! Archive with fixes created!
echo.
echo Next step: UPLOAD TO SERVER!
echo ================================================
pause