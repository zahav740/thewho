@echo off
echo ========================================
echo FILE SYSTEM DEBUG
echo ========================================
echo.

echo Current orders directory structure:
dir /s C:\Users\kasuf\Downloads\TheWho\production-crm\uploads\orders

echo.
echo Testing with browser:
echo Open: http://localhost:5100/api/filesystem/orders/TH1K4108A
echo.

echo Manual file check:
if exist "C:\Users\kasuf\Downloads\TheWho\production-crm\uploads\orders\TH1K4108A\2025-06-07" (
    echo 2025-06-07 folder EXISTS
) else (
    echo 2025-06-07 folder NOT FOUND
)

if exist "C:\Users\kasuf\Downloads\TheWho\production-crm\uploads\orders\TH1K4108A\2025-05-30" (
    echo 2025-05-30 folder EXISTS
) else (
    echo 2025-05-30 folder NOT FOUND
)

pause
