@echo off
echo ==============================================
echo FIXING LOGIN AND CENTERING PAGES
echo Backend: 5200, Frontend: 5201, API: kasuf.xyz
echo ==============================================

cd frontend

echo Creating production .env...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo Checking configuration...
findstr "kasuf.xyz" .env >nul
if errorlevel 1 (
    echo Configuration error!
    pause
    exit /b 1
) else (
    echo Configuration is correct
)

echo Cleaning cache and old build...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Building with fixed centering...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

call npm run build

if not exist build (
    echo Build error!
    pause
    exit /b 1
)

echo Checking build content...
if exist build\index.html (
    echo index.html found
) else (
    echo index.html not found!
    pause
    exit /b 1
)

echo Creating archive with fixed login...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo ==============================================
    echo SUCCESS! Login with centering fixed!
    echo ==============================================
    for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    echo.
    echo Fixes:
    echo - Completely rewritten positioning
    echo - Removed CSS style conflicts
    echo - Perfect centering on all devices
    echo - Absolute positioning for login/register
    echo - Correct API URLs for kasuf.xyz
    echo.
    echo Deployment on Beget:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo After deployment:
    echo   Site: https://kasuf.xyz
    echo   API: https://kasuf.xyz/api
    echo   Health: https://kasuf.xyz/health
) else (
    echo Archive creation error
)

cd ..
echo.
echo Ready for server upload!
pause