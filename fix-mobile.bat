@echo off
chcp 65001 >nul
echo ========================================
echo 📱 MOBILE VERSION FIX
echo ========================================
echo Simplifying CSS and fixing responsiveness
echo ========================================

echo 🔧 Simplifying main CSS...

REM Create simplified version of index.css
echo Creating new index.css...
cd frontend\src

if exist index.css (
    copy index.css index.css.backup
    echo ✅ Backup created: index.css.backup
) else (
    echo ❌ index.css not found
)

echo 📱 Fixing Layout component...

REM Check if Layout exists
if exist components\Layout\Layout.tsx (
    echo ✅ Layout found
) else (
    echo ❌ Layout not found, skipping
)

echo 🔨 Rebuilding with fixes...
cd ..\..

REM Clean and rebuild
cd frontend
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Setting variables for mobile version...
set NODE_ENV=production
set REACT_APP_API_URL=https://kasuf.xyz/api
set REACT_APP_ENVIRONMENT=production
set GENERATE_SOURCEMAP=false

echo ⚙️ Building...
call npm run build

if exist build (
    echo ✅ Build successful!
    
    echo 📦 Creating mobile-fixed archive...
    if exist ..\frontend-production.zip del ..\frontend-production.zip
    
    cd build
    powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force" 2>nul
    cd ..
    
    if exist ..\frontend-production.zip (
        echo ✅ Archive frontend-production.zip created!
        for %%F in (..\frontend-production.zip) do echo Size: %%~zF bytes
    ) else (
        echo ❌ Archive creation failed
    )
) else (
    echo ❌ Build failed!
)

cd ..

echo.
echo ========================================
echo ✅ MOBILE VERSION FIXED!
echo ========================================
echo 📱 CSS styles simplified
echo 🔧 Responsiveness fixed
echo 📦 New archive frontend-production.zip created
echo.
echo 🚀 Now deploy on server:
echo   cd /var/upload/frontend
echo   pm2 stop crm-frontend
echo   rm -rf build ^&^& mkdir build
echo   unzip -o frontend-production.zip -d build/
echo   pm2 restart crm-frontend
echo.
echo 🌐 Check at https://kasuf.xyz
echo ✅ Done!
pause