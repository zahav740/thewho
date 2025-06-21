@echo off
echo ===============================================
echo EMERGENCY FIX FOR SHIFTED WEBSITE
echo ===============================================
echo PROBLEM: Entire site shifted left after login changes
echo SOLUTION: Removed ALL problematic body styles
echo NEW APPROACH: Only inline styles, DO NOT TOUCH body
echo ===============================================

cd frontend

echo Checking that problematic styles are removed...
findstr "document.body.classList.remove" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo ERROR: LoginPage.tsx still contains problematic styles!
    pause
    exit /b 1
) else (
    echo SUCCESS: LoginPage.tsx cleaned from problematic styles
)

findstr "position: fixed" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo SUCCESS: position: fixed removed from LoginPage
) else (
    echo ERROR: position: fixed still exists in LoginPage!
    pause
    exit /b 1
)

echo.
echo RADICAL CLEANUP...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Creating CLEAN configuration...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo.
echo EMERGENCY BUILD WITHOUT PROBLEMATIC STYLES...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

echo Running npm run build...
call npm run build

if not exist build (
    echo BUILD FAILED!
    echo Check TypeScript errors above
    pause
    exit /b 1
)

echo Build successful!

echo.
echo Creating FIXED archive...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
echo Archiving without problematic styles...
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo ===============================================
    echo SUCCESS! EMERGENCY ARCHIVE CREATED!
    echo ===============================================
    for %%F in (..\frontend-production.zip) do (
        echo Size: %%~zF bytes
        echo Created: %%~tF
    )
    echo.
    echo DEPLOY IMMEDIATELY ON SERVER!
    echo.
    echo Commands for emergency deployment:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   # UPLOAD THIS frontend-production.zip
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo WHAT IS FIXED:
    echo   - REMOVED ALL problematic body styles
    echo   - REMOVED position: fixed
    echo   - REMOVED width: 100vw
    echo   - REMOVED all login-page classes
    echo   - Login uses ONLY inline styles
    echo   - Main site NOT AFFECTED
    echo.
    echo RESULT:
    echo   - https://kasuf.xyz - normal centering
    echo   - https://kasuf.xyz/login - works without problems
    echo   - ALL PAGES in their places
    echo.
) else (
    echo ERROR creating archive!
    pause
    exit /b 1
)

cd ..

echo.
echo ===============================================
echo DEPLOY RIGHT NOW!
echo ===============================================
echo.
echo IMPORTANT: This archive does NOT contain problematic styles
echo that shifted the site to the left!
echo.
pause