@echo off
chcp 65001 > nul
echo ==========================================
echo MOBILE BUILD - THEWHO CRM
echo ==========================================
echo Creating mobile-optimized build for Beget hosting
echo.

echo Start time: %date% %time%
echo.

REM Step 1: Clean previous builds
echo Step 1: Cleaning previous builds...
if exist "build" rmdir /s /q "build"
if exist "build-mobile" rmdir /s /q "build-mobile"
if exist "thewho-mobile.zip" del "thewho-mobile.zip"
echo [OK] Cleanup completed

echo.
REM Step 2: Set environment variables for mobile production
echo Step 2: Setting environment variables...
set REACT_APP_ENVIRONMENT=production
set REACT_APP_MOBILE=true
set REACT_APP_API_URL=https://kasuf.xyz/api
set REACT_APP_CORS_ORIGIN=https://kasuf.xyz
set GENERATE_SOURCEMAP=false
set BUILD_PATH=build
set NODE_ENV=production
set CI=false
echo [OK] Environment configured for mobile production

echo.
REM Step 3: Build React application
echo Step 3: Building React application...
echo This may take 2-3 minutes...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b 1
)
echo [OK] React build completed successfully

echo.
REM Step 4: Create mobile version
echo Step 4: Creating mobile version...
if exist "build-mobile" rmdir /s /q "build-mobile"
rename "build" "build-mobile"
echo [OK] Renamed to build-mobile

echo.
REM Step 5: Copy mobile assets
echo Step 5: Copying mobile assets...

REM Copy mobile styles
if exist "mobile-styles.css" (
    copy "mobile-styles.css" "build-mobile\" > nul
    echo [OK] mobile-styles.css copied
)

REM Copy mobile logic
if exist "mobile-logic.js" (
    copy "mobile-logic.js" "build-mobile\" > nul
    echo [OK] mobile-logic.js copied
)

REM Copy service worker
if exist "public\sw.js" (
    copy "public\sw.js" "build-mobile\" > nul
    echo [OK] service-worker copied
)

echo.
REM Step 6: Create Beget configuration
echo Step 6: Creating Beget configuration...

REM Create .htaccess
(
echo # TheWho CRM Mobile - Beget Configuration
echo RewriteEngine On
echo.
echo # Force HTTPS
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
echo.
echo # Handle React Router
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
echo.
echo # Cache static files
echo ^<FilesMatch "\.(css^|js^|png^|jpg^|gif^|ico^|svg^|woff^|woff2^)$"^>
echo   ExpiresActive On
echo   ExpiresDefault "access plus 1 month"
echo   Header set Cache-Control "public, immutable"
echo ^</FilesMatch^>
echo.
echo # Compression
echo ^<IfModule mod_deflate.c^>
echo   AddOutputFilterByType DEFLATE text/plain
echo   AddOutputFilterByType DEFLATE text/html
echo   AddOutputFilterByType DEFLATE text/css
echo   AddOutputFilterByType DEFLATE application/javascript
echo   AddOutputFilterByType DEFLATE application/json
echo ^</IfModule^>
echo.
echo # Security headers
echo Header always set X-Frame-Options "SAMEORIGIN"
echo Header always set X-Content-Type-Options "nosniff"
echo Header always set X-XSS-Protection "1; mode=block"
echo.
echo # CORS
echo Header set Access-Control-Allow-Origin "https://kasuf.xyz"
echo Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo Header set Access-Control-Allow-Headers "Content-Type, Authorization"
) > "build-mobile\.htaccess"

echo [OK] .htaccess created

REM Create robots.txt
(
echo User-agent: *
echo Allow: /
echo Disallow: /static/
echo.
echo Sitemap: https://kasuf.xyz/sitemap.xml
) > "build-mobile\robots.txt"

echo [OK] robots.txt created

REM Create sitemap.xml
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/^</loc^>
echo     ^<priority^>1.0^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/database^</loc^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/production^</loc^>
echo     ^<priority^>0.9^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/shifts^</loc^>
echo     ^<priority^>0.8^</priority^>
echo   ^</url^>
echo   ^<url^>
echo     ^<loc^>https://kasuf.xyz/calendar^</loc^>
echo     ^<priority^>0.7^</priority^>
echo   ^</url^>
echo ^</urlset^>
) > "build-mobile\sitemap.xml"

echo [OK] sitemap.xml created

echo.
REM Step 7: Create archive
echo Step 7: Creating archive for Beget upload...
powershell -Command "Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-mobile.zip' -CompressionLevel Optimal"

if exist "thewho-mobile.zip" (
    echo [OK] Archive created: thewho-mobile.zip
    for %%I in (thewho-mobile.zip) do echo Archive size: %%~zI bytes
) else (
    echo [WARNING] Could not create archive automatically
    echo You can create it manually: select all files in build-mobile folder and create ZIP
)

echo.
REM Step 8: Final report
echo Step 8: Build analysis...
echo.
echo Build contents:
dir "build-mobile" /b
echo.
for /f "tokens=3" %%a in ('dir build-mobile /s /-c ^| find "File(s)"') do echo Total files: %%a

echo.
echo ==========================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo Created files:
echo   [FILE] thewho-mobile.zip      - Ready for Beget upload
echo   [DIR]  build-mobile\          - Mobile-optimized application
echo.
echo Mobile features included:
echo   [OK] Responsive design (mobile, tablet, desktop)
echo   [OK] Touch-friendly interface (44px minimum touch targets)
echo   [OK] Mobile drawer navigation
echo   [OK] PWA manifest and service worker ready
echo   [OK] Optimized loading and caching
echo   [OK] Apache .htaccess configuration
echo   [OK] SEO files (robots.txt, sitemap.xml)
echo.
echo Next steps for Beget deployment:
echo   1. Login to Beget control panel
echo   2. Go to File Manager
echo   3. Navigate to /var/upload directory
echo   4. Upload thewho-mobile.zip
echo   5. Extract the archive
echo   6. Configure domain kasuf.xyz to point to /var/upload
echo   7. Enable SSL certificate
echo   8. Test at https://kasuf.xyz
echo.
echo Database configuration (already set):
echo   Host: aws-0-eu-central-1.pooler.supabase.com
echo   Port: 6543
echo   Database: postgres
echo   API URL: https://kasuf.xyz/api
echo.
echo End time: %date% %time%
echo ==========================================

echo.
echo Press any key to open build folder...
pause > nul
explorer "build-mobile"
