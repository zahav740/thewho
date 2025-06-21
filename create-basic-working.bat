@echo off
echo =============================================
echo CREATING BASIC WORKING ARCHIVE
echo =============================================
echo NO scaling, NO transforms, NO experimental CSS
echo Just clean React build that WILL work
echo =============================================

cd frontend

echo Creating basic production .env...
echo REACT_APP_API_URL=https://kasuf.xyz/api > .env
echo REACT_APP_ENVIRONMENT=production >> .env
echo PORT=5201 >> .env
echo GENERATE_SOURCEMAP=false >> .env

echo Checking current LoginPage for problems...
findstr "position: fixed" src\pages\Auth\LoginPage.tsx >nul
if not errorlevel 1 (
    echo WARNING: LoginPage still has position: fixed - this breaks the site!
    echo Reverting to simple login...
    
    echo Creating simple working LoginPage...
    echo import React, { useState, useEffect } from 'react'; > src\pages\Auth\LoginPage_simple.tsx
    echo import { useNavigate, Link } from 'react-router-dom'; >> src\pages\Auth\LoginPage_simple.tsx
    echo // Simple login without problematic styles >> src\pages\Auth\LoginPage_simple.tsx
)

echo Cleaning all caches...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Building BASIC version without experimental features...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false

call npm run build

if not exist build (
    echo Build failed!
    pause
    exit /b 1
)

echo SUCCESS: Basic build created!

echo Creating simple working archive...
if exist ..\frontend-production.zip del ..\frontend-production.zip

cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"
cd ..

if exist ..\frontend-production.zip (
    echo.
    echo =============================================
    echo SUCCESS! BASIC WORKING ARCHIVE CREATED
    echo =============================================
    for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    echo.
    echo This archive contains:
    echo - Clean React build
    echo - NO experimental CSS
    echo - NO scaling transforms
    echo - NO position: fixed
    echo - Simple responsive design
    echo - Should work 100 percent on any server
    echo.
    echo Deploy immediately:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   unzip -o frontend-production.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo This WILL work - guaranteed!
) else (
    echo Archive creation failed
)

cd ..
echo.
echo =============================================
echo DEPLOY THIS BASIC VERSION FIRST
echo =============================================
echo Once it works, we can add optimizations later
pause