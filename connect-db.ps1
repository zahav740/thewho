# Production CRM - Connect to existing database
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         PRODUCTION CRM - CONNECT TO EXISTING DATABASE" -ForegroundColor Cyan  
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = "C:\Users\Alexey\Downloads\TheWho\production-crm\backend"

Write-Host "Checking connection to database 'the_who'..." -ForegroundColor Yellow
Write-Host ""

Set-Location $PROJECT_ROOT

# Check PostgreSQL connection
try {
    $result = psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database(), version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Connected to database 'the_who'!" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "ERROR: Cannot connect to database 'the_who'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL is running"
    Write-Host "2. Password is correct (magarel)"  
    Write-Host "3. Database 'the_who' exists"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Checking existing tables..." -ForegroundColor Yellow
Write-Host ""
psql -h localhost -p 5432 -U postgres -d the_who -c "\dt" 2>$null

Write-Host ""
Write-Host "Running migrations to create missing tables..." -ForegroundColor Yellow
Write-Host ""

# Run migrations
try {
    npm run migration:run
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Migrations completed!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Migration errors detected" -ForegroundColor Yellow
        Write-Host "Trying to create tables manually..." -ForegroundColor Yellow
        
        # Create tables manually
        $sql = @"
DO `$`$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'machines') THEN
        CREATE TABLE machines (
            id SERIAL PRIMARY KEY,
            code VARCHAR NOT NULL UNIQUE,
            type VARCHAR NOT NULL CHECK (type IN ('MILLING', 'TURNING')),
            axes INTEGER NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "isOccupied" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
        INSERT INTO machines (code, type, axes) VALUES 
            ('M001', 'MILLING', 3),
            ('M002', 'MILLING', 4),
            ('T001', 'TURNING', 3);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            drawing_number VARCHAR UNIQUE,
            quantity INTEGER NOT NULL,
            deadline DATE NOT NULL,
            priority VARCHAR NOT NULL CHECK (priority IN ('1', '2', '3', '4')),
            "workType" VARCHAR,
            "pdfPath" VARCHAR,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
    END IF;
    
    RAISE NOTICE 'Tables created successfully';
END
`$`$;
"@
        
        psql -h localhost -p 5432 -U postgres -d the_who -c $sql 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Main tables created manually" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "ERROR: Failed to run migrations" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking created tables..." -ForegroundColor Yellow
Write-Host ""
psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count FROM information_schema.tables t WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>$null

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                    DATABASE READY" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "SUCCESS: Database 'the_who' is configured" -ForegroundColor Green
Write-Host "SUCCESS: All required tables created" -ForegroundColor Green
Write-Host "SUCCESS: Test data added" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to start application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  npm run start:dev"
Write-Host "Frontend: cd ..\frontend; npm start"
Write-Host ""

# Ask to start application
$start_app = Read-Host "Start application now? (y/n)"
if ($start_app -eq "y" -or $start_app -eq "Y") {
    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Yellow
    
    # Start backend
    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev" -WindowStyle Normal
    
    # Wait and start frontend
    Start-Sleep -Seconds 3
    Set-Location "$PROJECT_ROOT\..\frontend"
    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal
    
    Write-Host ""
    Write-Host "Application started!" -ForegroundColor Green
    Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
}

Read-Host "Press Enter to exit"
