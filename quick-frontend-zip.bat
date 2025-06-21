@echo off
echo =========================================
echo Creating frontend-production.zip 
echo With correct settings for KASUF.XYZ
echo =========================================
echo Backend: https://kasuf.xyz/api
echo Frontend: port 5201
echo SSL: HTTPS required
echo =========================================

cd frontend

echo Step 1: Setting up production environment...

echo Creating .env for HTTPS kasuf.xyz...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo BROWSER=none >> .env
echo OPEN_BROWSER=false >> .env
echo GENERATE_SOURCEMAP=false >> .env
echo NODE_OPTIONS=--max-old-space-size=4096 >> .env

echo .env file created:
type .env

echo.
echo Step 2: Building Frontend with correct settings...

if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set REACT_APP_ENVIRONMENT=production
set GENERATE_SOURCEMAP=false

echo Environment variables:
echo NODE_ENV=%NODE_ENV%
echo REACT_APP_API_URL=%REACT_APP_API_URL%

echo Starting build...
call npm run build

if not exist build (
    echo Build failed!
    pause
    exit /b 1
)

echo Build completed successfully!

echo.
echo Step 3: Checking API URL in build...

findstr /r /c:"https://kasuf\.xyz/api" build\static\js\*.js >nul 2>&1
if %errorlevel%==0 (
    echo Found correct API URL: https://kasuf.xyz/api
) else (
    echo https://kasuf.xyz/api not found in build
)

findstr /r /c:"localhost:510" build\static\js\*.js >nul 2>&1
if %errorlevel%==0 (
    echo WARNING: Found localhost:510x references!
) else (
    echo No localhost:510x references
)

findstr /r /c:"http://kasuf\.xyz" build\static\js\*.js >nul 2>&1
if %errorlevel%==0 (
    echo WARNING: Found HTTP links!
) else (
    echo All links use HTTPS
)

echo.
echo Step 4: Creating frontend-production.zip archive...

if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo frontend-production.zip created!
    for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    echo Location: %CD%\..\frontend-production.zip
) else (
    echo Archive creation failed
    pause
    exit /b 1
)

cd ..

echo.
echo =========================================
echo FRONTEND-PRODUCTION.ZIP READY!
echo =========================================
echo Archive: frontend-production.zip
echo API URL: https://kasuf.xyz/api (HTTPS)
echo Server port: 5201
echo.
echo Commands for server deployment:
echo.
echo   cd /var/upload/frontend
echo   pm2 stop crm-frontend
echo   rm -rf build
echo   mkdir build  
echo   unzip -o frontend-production.zip -d build/
echo   cd /var/upload
echo   sed -i "s/-l 5101/-l 5201/" ecosystem.config.js
echo   pm2 restart crm-frontend
echo.
echo After deployment site will work at:
echo   https://kasuf.xyz
echo.
echo Ready for server upload!
pause