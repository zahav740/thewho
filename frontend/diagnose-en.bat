@echo off
echo ==========================================
echo MOBILE BUILD DIAGNOSTICS
echo ==========================================
echo.

echo Start time: %date% %time%
echo.

REM Check 1: Basic files
echo CHECK 1: Project Structure
echo ==========================================
echo Current directory: %cd%
echo.

if exist "package.json" (
    echo [OK] package.json found
    echo Package info:
    type package.json | findstr "name\|version\|scripts"
) else (
    echo [ERROR] package.json NOT FOUND
    echo Make sure you run this from frontend folder
    goto :end
)

if exist "src" (
    echo [OK] src folder found
) else (
    echo [ERROR] src folder NOT FOUND
)

if exist "public" (
    echo [OK] public folder found
) else (
    echo [ERROR] public folder NOT FOUND
)

echo.
REM Check 2: Node.js and npm
echo CHECK 2: Environment
echo ==========================================

echo Checking Node.js...
node --version > temp_node.txt 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js NOT FOUND or NOT WORKING
    echo Install Node.js from https://nodejs.org
    type temp_node.txt
    del temp_node.txt
    goto :end
) else (
    set /p NODE_VER=<temp_node.txt
    echo [OK] Node.js working: %NODE_VER%
    del temp_node.txt
)

echo Checking npm...
npm --version > temp_npm.txt 2>&1
if errorlevel 1 (
    echo [ERROR] npm NOT FOUND or NOT WORKING
    type temp_npm.txt
    del temp_npm.txt
    goto :end
) else (
    set /p NPM_VER=<temp_npm.txt
    echo [OK] npm working: %NPM_VER%
    del temp_npm.txt
)

echo.
REM Check 3: Dependencies
echo CHECK 3: Dependencies
echo ==========================================

if exist "node_modules" (
    echo [OK] node_modules found
) else (
    echo [ERROR] node_modules NOT FOUND
    echo You need to run: npm install
)

if exist "package-lock.json" (
    echo [OK] package-lock.json found
) else (
    echo [WARNING] package-lock.json not found (may be normal)
)

echo.
REM Check 4: TypeScript compilation
echo CHECK 4: TypeScript
echo ==========================================

echo Checking TypeScript compilation...
npx tsc --noEmit --skipLibCheck > temp_tsc.txt 2>&1
if errorlevel 1 (
    echo [ERROR] TYPESCRIPT ERRORS FOUND:
    echo ----------------------------------------
    type temp_tsc.txt
    echo ----------------------------------------
    echo.
    echo You need to fix TypeScript errors above
    del temp_tsc.txt
) else (
    echo [OK] TypeScript compilation successful
    del temp_tsc.txt
)

echo.
REM Check 5: Test build
echo CHECK 5: Test Build
echo ==========================================

echo Attempting test build...
echo (this may take a few minutes)

REM Set environment variables
set GENERATE_SOURCEMAP=false
set CI=false

echo Running npm run build...
npm run build > temp_build.txt 2>&1
if errorlevel 1 (
    echo [ERROR] BUILD FAILED
    echo ----------------------------------------
    echo LAST ERROR LINES:
    powershell -Command "Get-Content temp_build.txt | Select-Object -Last 20"
    echo ----------------------------------------
    echo.
    echo Full error log saved to temp_build.txt
    echo Open this file for detailed analysis
) else (
    echo [OK] BUILD SUCCESSFUL!
    del temp_build.txt
    
    if exist "build" (
        echo [OK] build folder created
        echo Build contents:
        dir build /b
    ) else (
        echo [ERROR] build folder not created
    )
)

echo.
REM Check 6: Mobile files
echo CHECK 6: Mobile Files
echo ==========================================

if exist "src\hooks\useMobile.ts" (
    echo [OK] useMobile.ts found
) else (
    echo [ERROR] useMobile.ts NOT FOUND
)

if exist "src\components\Mobile\MobileWrapper.tsx" (
    echo [OK] MobileWrapper.tsx found
) else (
    echo [ERROR] MobileWrapper.tsx NOT FOUND
)

if exist "src\styles\mobile.css" (
    echo [OK] mobile.css found
) else (
    echo [ERROR] mobile.css NOT FOUND
)

if exist "mobile-styles.css" (
    echo [OK] mobile-styles.css found
) else (
    echo [ERROR] mobile-styles.css NOT FOUND
)

if exist "mobile-logic.js" (
    echo [OK] mobile-logic.js found
) else (
    echo [ERROR] mobile-logic.js NOT FOUND
)

echo.
REM Final report
echo FINAL REPORT
echo ==========================================

echo Issues that need to be fixed:
echo.

if not exist "package.json" echo - Run script from frontend folder
if not exist "node_modules" echo - Run: npm install
if exist "temp_tsc.txt" echo - Fix TypeScript errors
if exist "temp_build.txt" echo - Check build errors in temp_build.txt

echo.
echo Next steps:
echo 1. Fix issues above
echo 2. Run diagnostics again
echo 3. If all OK, run main build script

:end
echo.
echo End time: %date% %time%
echo.
echo Press any key to exit...
pause > nul
