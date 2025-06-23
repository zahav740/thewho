@echo off
echo ===================================
echo FIXING API URLS - CORRECTED VERSION
echo ===================================

set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set FIXED_ARCHIVE=frontend-production-fixed-v2-%TIMESTAMP%.zip

echo Step 1: Fixing API URLs correctly...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\beget-archives\frontend-production-20250621_184354\static\js"

echo Creating backup...
copy "main.a88af3c4.js" "main.a88af3c4.js.backup2" >nul

echo Correct replacements...
REM Заменяем полные URL на относительные
powershell -Command "(Get-Content 'main.a88af3c4.js') -replace 'http://localhost:5100/api', '/api' -replace 'http://localhost:3001/api', '/api' -replace 'http://localhost:5101/api', '/api' -replace '\"http://localhost:5100\"', '\"/api\"' -replace '\"http://localhost:3001\"', '\"/api\"' -replace '\"http://localhost:5101\"', '\"/api\"' | Set-Content 'main.a88af3c4.js'"

echo Step 2: Creating corrected archive...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\beget-archives"

powershell -Command "Compress-Archive -Path 'frontend-production-20250621_184354\*' -DestinationPath '%FIXED_ARCHIVE%' -Force"

if exist "%FIXED_ARCHIVE%" (
    echo.
    echo ===================================
    echo SUCCESS! CORRECTED ARCHIVE CREATED
    echo ===================================
    echo Archive: %FIXED_ARCHIVE%
    
    for %%F in ("%FIXED_ARCHIVE%") do set SIZE=%%~zF
    set /a SIZE_MB=%SIZE%/1024/1024
    echo Size: %SIZE% bytes (~%SIZE_MB% MB)
    echo.
    echo CORRECTED CHANGES:
    echo - Fixed triple slash issue
    echo - All localhost URLs → /api
    echo - Proper relative paths
    echo.
    echo READY FOR RE-DEPLOYMENT!
) else (
    echo ERROR: Failed to create archive
)

pause