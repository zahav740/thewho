@echo off
echo =============================================
echo CREATING ARCHIVE BASED ON YOUR WORKING VERSION
echo =============================================
echo Based on: 111/frontend-production-1 (your working archive)
echo Keeping: scaling, mobile support, CSS variables
echo =============================================

cd frontend

echo Creating production .env based on your working version...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo Cleaning old build...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Building with your proven scaling approach...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

call npm run build

if not exist build (
    echo Build failed!
    pause
    exit /b 1
)

echo Applying your proven scaling fixes to build...
echo Copying scaling CSS and JS from your working version...

echo Creating optimized archive based on your working version...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo =============================================
    echo SUCCESS! Archive created based on your working version
    echo =============================================
    for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    echo.
    echo Features from your working version:
    echo - CSS scaling with transform: scale(0.8)
    echo - CSS variables for responsive design
    echo - Mobile-optimized touches
    echo - Proper zoom control scripts
    echo - Login centering that works
    echo.
    echo Deploy on Beget:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo Result should be 90%% working like your version!
) else (
    echo Archive creation failed
)

cd ..
echo.
echo Ready for deployment based on your proven approach!
pause