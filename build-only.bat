@echo off
echo Building frontend for kasuf.xyz...

cd frontend

echo Setting environment...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env

set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api

echo Cleaning...
if exist build rmdir /s /q build

echo Building...
call npm run build

if exist build (
    echo Build successful!
    echo Location: %CD%\build
    
    echo Checking build...
    findstr "kasuf.xyz" build\static\js\*.js >nul 2>&1
    if %errorlevel%==0 (
        echo API URL found in build
    ) else (
        echo WARNING: API URL not found
    )
) else (
    echo Build failed!
)

cd ..
pause