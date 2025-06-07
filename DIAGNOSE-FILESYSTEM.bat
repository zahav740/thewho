@echo off
echo ========================================
echo FILESYSTEM SERVICE DIAGNOSTIC
echo ========================================
echo.

echo Testing specific API endpoints...
echo.

echo 1. Direct path test:
curl -s "http://localhost:5100/api/filesystem/orders"
echo.
echo.

echo 2. Statistics test:
curl -s "http://localhost:5100/api/filesystem/orders/statistics/overview"
echo.
echo.

echo 3. Backend logs check:
echo Check your backend console for logs containing:
echo - "OrderFileSystemService initialized with path"
echo - "Found X items in directory"
echo - "Found X order directories"
echo.

echo 4. Manual path verification:
echo Current directory: %CD%
echo Expected path: %CD%\uploads\orders
echo.
dir /b uploads\orders 2>nul
if %errorlevel% equ 0 (
    echo Directory contents found above
) else (
    echo Directory not accessible or empty
)

echo.
echo Diagnostic completed!
pause
