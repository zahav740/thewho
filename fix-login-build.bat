@echo off
echo Fixing login page layout and building...

cd frontend

echo Creating fixed .env...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo Building...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api

if exist build rmdir /s /q build
call npm run build

if not exist build (
    echo Build failed!
    pause
    exit /b 1
)

echo Creating archive...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo SUCCESS! Login page fixed and archive created!
    for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    echo.
    echo Deploy with:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
) else (
    echo Archive creation failed
)

cd ..
pause