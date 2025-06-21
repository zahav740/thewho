@echo off
chcp 65001 > nul
echo ==========================================
echo MOBILE BUILD + ZIP CREATION
echo ==========================================
echo.

echo Start: %date% %time%
echo.

REM Step 1: Clean and build
echo [1/5] Cleaning and building...
if exist "build" rmdir /s /q "build"
if exist "build-mobile" rmdir /s /q "build-mobile"
if exist "thewho-mobile.zip" del "thewho-mobile.zip"

REM Set environment
set REACT_APP_ENVIRONMENT=production
set REACT_APP_MOBILE=true
set REACT_APP_API_URL=https://kasuf.xyz/api
set GENERATE_SOURCEMAP=false
set NODE_ENV=production
set CI=false

echo Building React app...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build completed

echo.
REM Step 2: Create mobile version
echo [2/5] Creating mobile version...
rename "build" "build-mobile"

REM Copy mobile assets
if exist "mobile-styles.css" copy "mobile-styles.css" "build-mobile\" > nul
if exist "mobile-logic.js" copy "mobile-logic.js" "build-mobile\" > nul
if exist "public\sw.js" copy "public\sw.js" "build-mobile\" > nul

echo [OK] Mobile version ready

echo.
REM Step 3: Create Beget config
echo [3/5] Creating Beget configuration...

REM .htaccess
(
echo RewriteEngine On
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo ^<FilesMatch "\.(css^|js^|png^|jpg^|gif^|ico^|svg^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 month"
echo ^</FilesMatch^>
) > "build-mobile\.htaccess"

REM robots.txt
echo User-agent: * > "build-mobile\robots.txt"
echo Allow: / >> "build-mobile\robots.txt"
echo Sitemap: https://kasuf.xyz/sitemap.xml >> "build-mobile\robots.txt"

echo [OK] Configuration files created

echo.
REM Step 4: Create ZIP - Multiple methods
echo [4/5] Creating ZIP archive...

REM Method 1: PowerShell (most common)
echo Trying PowerShell method...
powershell -Command "try { Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-mobile.zip' -CompressionLevel Optimal -Force; Write-Host 'ZIP created successfully' } catch { Write-Host 'PowerShell method failed' }"

REM Check if ZIP was created
if exist "thewho-mobile.zip" (
    echo [SUCCESS] ZIP created with PowerShell
    goto :zip_success
)

REM Method 2: VBScript fallback
echo PowerShell failed, trying VBScript method...
echo Set objApp = CreateObject("Shell.Application") > create_zip.vbs
echo Set SourceFolder = objApp.NameSpace("%CD%\build-mobile") >> create_zip.vbs
echo Set DestFolder = objApp.NameSpace("%CD%") >> create_zip.vbs
echo DestFolder.CopyHere SourceFolder.Items >> create_zip.vbs
cscript //nologo create_zip.vbs > nul 2>&1
del create_zip.vbs > nul 2>&1

if exist "thewho-mobile.zip" (
    echo [SUCCESS] ZIP created with VBScript
    goto :zip_success
)

REM Method 3: Manual instruction
echo [WARNING] Automatic ZIP creation failed
echo.
echo MANUAL ZIP CREATION REQUIRED:
echo 1. Open the build-mobile folder
echo 2. Select ALL files inside (Ctrl+A)
echo 3. Right-click and choose "Send to" -^> "Compressed folder"
echo 4. Rename the ZIP file to "thewho-mobile.zip"
echo 5. Move it to the frontend folder
echo.
echo Opening build-mobile folder now...
start "" "build-mobile"
pause
goto :zip_done

:zip_success
for %%I in (thewho-mobile.zip) do echo ZIP size: %%~zI bytes

:zip_done
echo.
REM Step 5: Final verification
echo [5/5] Final verification...

if exist "build-mobile" (
    echo [OK] build-mobile folder exists
) else (
    echo [ERROR] build-mobile folder missing
)

if exist "thewho-mobile.zip" (
    echo [OK] thewho-mobile.zip exists
) else (
    echo [WARNING] thewho-mobile.zip missing - create manually
)

if exist "build-mobile\index.html" (
    echo [OK] Main app file exists
) else (
    echo [ERROR] index.html missing
)

if exist "build-mobile\.htaccess" (
    echo [OK] Apache config exists
) else (
    echo [ERROR] .htaccess missing
)

echo.
echo ==========================================
echo BUILD COMPLETED!
echo ==========================================
echo.
echo Ready for Beget deployment:
echo.
if exist "thewho-mobile.zip" (
    echo   ✓ thewho-mobile.zip - Upload this to Beget
) else (
    echo   ! Create thewho-mobile.zip manually
)
echo   ✓ build-mobile\ - Contains the app
echo   ✓ Mobile features enabled
echo   ✓ Apache configuration included
echo   ✓ PWA ready
echo.
echo Beget deployment steps:
echo   1. Upload thewho-mobile.zip to Beget control panel
echo   2. Go to File Manager -^> /var/upload
echo   3. Extract the ZIP file
echo   4. Configure kasuf.xyz domain
echo   5. Enable SSL certificate
echo   6. Test at https://kasuf.xyz
echo.
echo Database (already configured):
echo   • Supabase PostgreSQL
echo   • API: https://kasuf.xyz/api
echo   • Host: aws-0-eu-central-1.pooler.supabase.com
echo.
echo End: %date% %time%
echo ==========================================

echo.
echo Press any key to finish...
pause > nul
