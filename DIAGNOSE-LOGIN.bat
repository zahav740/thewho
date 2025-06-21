@echo off
echo =====================================
echo LOGIN CENTERING PROBLEM DIAGNOSIS
echo =====================================

echo Checking local files...

cd frontend\src\pages\Auth

echo.
echo Checking LoginPage.tsx...
findstr "position: 'fixed'" LoginPage.tsx >nul
if errorlevel 1 (
    echo ERROR: LoginPage.tsx does NOT contain position: 'fixed'
    echo File is NOT FIXED!
) else (
    echo OK: LoginPage.tsx contains position: 'fixed'
)

findstr "rootContainerStyles" LoginPage.tsx >nul
if errorlevel 1 (
    echo ERROR: LoginPage.tsx does NOT contain rootContainerStyles
    echo File is NOT FIXED!
) else (
    echo OK: LoginPage.tsx contains rootContainerStyles
)

findstr "zIndex: 999999" LoginPage.tsx >nul
if errorlevel 1 (
    echo ERROR: LoginPage.tsx does NOT contain zIndex: 999999
    echo File is NOT FIXED!
) else (
    echo OK: LoginPage.tsx contains zIndex: 999999
)

echo.
echo Checking RegisterPage.tsx...
findstr "position: 'fixed'" RegisterPage.tsx >nul
if errorlevel 1 (
    echo ERROR: RegisterPage.tsx does NOT contain position: 'fixed'
    echo File is NOT FIXED!
) else (
    echo OK: RegisterPage.tsx contains position: 'fixed'
)

cd ..\..\..

echo.
echo Checking archives...
if exist frontend-production.zip (
    echo OK: frontend-production.zip exists
    for %%F in (frontend-production.zip) do echo Size: %%~zF bytes
    echo Creation date:
    for %%F in (frontend-production.zip) do echo %%~tF
) else (
    echo ERROR: frontend-production.zip NOT FOUND
)

echo.
echo Checking .env files...
if exist frontend\.env (
    echo OK: frontend\.env found:
    type frontend\.env
) else (
    echo ERROR: frontend\.env not found
)

echo.
echo Checking .env.local...
if exist frontend\.env.local (
    echo OK: frontend\.env.local found:
    type frontend\.env.local
    echo.
    findstr "5200" frontend\.env.local >nul
    if errorlevel 1 (
        echo ERROR: .env.local contains wrong API port
    ) else (
        echo OK: .env.local contains correct port 5200
    )
) else (
    echo ERROR: frontend\.env.local not found
)

echo.
echo =====================================
echo DIAGNOSIS COMPLETED
echo =====================================

echo.
echo PROBABLE CAUSE OF PROBLEM:
echo Server kasuf.xyz has OLD archive without fixes!
echo.
echo SOLUTION:
echo 1. Run create-fixed-archive.bat
echo 2. Upload NEW frontend-production.zip to server
echo 3. Deploy with commands from script
echo.
echo After deployment https://kasuf.xyz/login
echo SHOULD be perfectly centered!
echo.
pause