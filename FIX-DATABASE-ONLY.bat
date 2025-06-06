@echo off
echo ====================================
echo DATABASE OPERATIONS FIX
echo ====================================
echo.

echo This script will fix the operations data in the database.
echo You will be prompted for PostgreSQL password.
echo Default password is usually: magarel
echo.

echo Connecting to database: localhost:5432/thewho
echo User: postgres
echo.

echo Running operations fix...
psql -h localhost -p 5432 -U postgres -d thewho -f "FIX-SIMPLE.sql"

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo DATABASE FIX SUCCESSFUL!
    echo ====================================
    echo.
    echo Order C6HP0021A should now have 3 operations.
    echo You can now start the application normally.
) else (
    echo.
    echo ====================================
    echo DATABASE FIX FAILED!
    echo ====================================
    echo.
    echo Check:
    echo 1. PostgreSQL is running
    echo 2. Database 'thewho' exists
    echo 3. Password is correct (usually 'magarel')
)

echo.
pause
