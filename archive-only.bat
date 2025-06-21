@echo off
echo Creating archive from existing build...

if not exist frontend\build (
    echo ERROR: frontend\build not found!
    echo Run build-only.bat first
    pause
    exit /b 1
)

echo Creating frontend-production.zip...
if exist frontend-production.zip del frontend-production.zip

cd frontend\build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..\..

if exist frontend-production.zip (
    echo SUCCESS! Archive created: frontend-production.zip
    for %%F in (frontend-production.zip) do echo Size: %%~zF bytes
    
    echo.
    echo Deploy commands:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build && mkdir build
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
) else (
    echo Archive creation failed!
)

pause