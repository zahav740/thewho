@echo off
echo ==========================================
echo SIMPLE ZIP CREATOR
echo ==========================================
echo.

if not exist "build-mobile" (
    echo [ERROR] build-mobile folder not found
    echo Run mobile-build.bat first
    pause
    exit /b 1
)

echo Creating ZIP from build-mobile folder...
echo.

REM Remove old ZIP
if exist "thewho-mobile.zip" (
    del "thewho-mobile.zip"
    echo Old ZIP removed
)

REM Try PowerShell method
echo Attempting to create ZIP...
powershell -Command "Compress-Archive -Path 'build-mobile\*' -DestinationPath 'thewho-mobile.zip' -CompressionLevel Optimal -Force"

if exist "thewho-mobile.zip" (
    echo [SUCCESS] ZIP created: thewho-mobile.zip
    for %%I in (thewho-mobile.zip) do echo Size: %%~zI bytes
    echo.
    echo Ready for Beget upload!
) else (
    echo [FAILED] Automatic ZIP creation failed
    echo.
    echo Manual method:
    echo 1. Open build-mobile folder
    echo 2. Select all files (Ctrl+A)
    echo 3. Right-click -^> Send to -^> Compressed folder
    echo 4. Rename to thewho-mobile.zip
    echo.
    start "" "build-mobile"
)

echo.
pause
