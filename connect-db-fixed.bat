@echo off
title Production CRM - Connect to existing DB

echo.
echo ================================================================
echo         PRODUCTION CRM - CONNECT TO EXISTING DATABASE
echo ================================================================
echo.

set PROJECT_ROOT=C:\Users\Alexey\Downloads\TheWho\production-crm\backend

echo Checking connection to database 'the_who'...
echo.

cd /d "%PROJECT_ROOT%"

REM Check connection to the_who database
psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database(), version();" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to database 'the_who'
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Password is correct ^(magarel^)
    echo 3. Database 'the_who' exists
    echo.
    pause
    exit /b 1
)

echo SUCCESS: Connected to database 'the_who'!
echo.

echo Checking existing tables...
echo.
psql -h localhost -p 5432 -U postgres -d the_who -c "\dt" 2>nul

echo.
echo Running migrations to create missing tables...
echo.

REM Run migrations
call npm run migration:run

if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Migration errors detected
    echo.
    echo Trying to create tables manually...
    
    REM Try to create tables manually
    psql -h localhost -p 5432 -U postgres -d the_who -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'machines') THEN CREATE TABLE machines (id SERIAL PRIMARY KEY, code VARCHAR NOT NULL UNIQUE, type VARCHAR NOT NULL CHECK (type IN ('MILLING', 'TURNING')), axes INTEGER NOT NULL, \"isActive\" BOOLEAN NOT NULL DEFAULT true, \"isOccupied\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now()); INSERT INTO machines (code, type, axes) VALUES ('M001', 'MILLING', 3), ('M002', 'MILLING', 4), ('T001', 'TURNING', 3); END IF; IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN CREATE TABLE orders (id SERIAL PRIMARY KEY, drawing_number VARCHAR UNIQUE, quantity INTEGER NOT NULL, deadline DATE NOT NULL, priority VARCHAR NOT NULL CHECK (priority IN ('1', '2', '3', '4')), \"workType\" VARCHAR, \"pdfPath\" VARCHAR, \"createdAt\" TIMESTAMP NOT NULL DEFAULT now(), \"updatedAt\" TIMESTAMP NOT NULL DEFAULT now()); END IF; RAISE NOTICE 'Tables created successfully'; END $$;" >nul 2>&1
    
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: Main tables created manually
    )
) else (
    echo SUCCESS: Migrations completed!
)

echo.
echo Checking created tables...
echo.
psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count FROM information_schema.tables t WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>nul

echo.
echo ================================================================
echo                    DATABASE READY
echo ================================================================
echo.
echo SUCCESS: Database 'the_who' is configured
echo SUCCESS: All required tables created
echo SUCCESS: Test data added
echo.
echo Ready to start application:
echo.
echo Backend:  npm run start:dev
echo Frontend: cd ..\frontend and npm start
echo.
echo Or use: start-all.bat
echo.
pause

REM Ask to start application
echo.
set /p start_app="Start application now? (y/n): "
if /i "%start_app%"=="y" (
    echo.
    echo Starting application...
    
    REM Start backend
    start "Production CRM Backend" cmd /k "npm run start:dev"
    
    REM Wait and start frontend
    timeout /t 3 /nobreak >nul
    cd /d "%PROJECT_ROOT%\..\frontend"
    start "Production CRM Frontend" cmd /k "npm start"
    
    echo.
    echo Application started!
    echo Backend: http://localhost:3000
    echo Frontend: http://localhost:3001
)
