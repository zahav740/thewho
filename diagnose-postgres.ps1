# PostgreSQL Diagnostics and Fix
Write-Host "=== PostgreSQL Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "1. Checking if PostgreSQL is running..." -ForegroundColor Yellow

# Try different ways to check PostgreSQL
$pgRunning = $false

# Method 1: Check service
try {
    $services = Get-Service | Where-Object {$_.Name -like "*postgresql*" -or $_.DisplayName -like "*PostgreSQL*"}
    if ($services) {
        Write-Host "Found PostgreSQL services:" -ForegroundColor Green
        foreach ($service in $services) {
            Write-Host "  - $($service.DisplayName): $($service.Status)" -ForegroundColor White
            if ($service.Status -eq "Running") {
                $pgRunning = $true
            }
        }
    } else {
        Write-Host "No PostgreSQL service found" -ForegroundColor Red
    }
} catch {
    Write-Host "Cannot check services" -ForegroundColor Red
}

Write-Host ""

# Method 2: Check if pg_isready exists and works
Write-Host "2. Testing pg_isready command..." -ForegroundColor Yellow
try {
    $pgReadyResult = pg_isready -h localhost -p 5432 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is accepting connections" -ForegroundColor Green
        $pgRunning = $true
    } else {
        Write-Host "pg_isready failed: $pgReadyResult" -ForegroundColor Red
    }
} catch {
    Write-Host "pg_isready command not found or failed" -ForegroundColor Red
}

Write-Host ""

# Method 3: Try to connect with psql
Write-Host "3. Testing psql connection..." -ForegroundColor Yellow
try {
    # Try connecting to default postgres database first
    $psqlResult = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Can connect to PostgreSQL with user 'postgres'" -ForegroundColor Green
        $pgRunning = $true
        
        # Now check if the_who database exists
        Write-Host "4. Checking if database 'the_who' exists..." -ForegroundColor Yellow
        $dbCheckResult = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'the_who';" -t 2>&1
        if ($dbCheckResult -match "1") {
            Write-Host "Database 'the_who' exists" -ForegroundColor Green
            
            # Try connecting to the_who database
            $theWhoResult = psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database();" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Successfully connected to 'the_who' database!" -ForegroundColor Green
            } else {
                Write-Host "Cannot connect to 'the_who' database: $theWhoResult" -ForegroundColor Red
            }
        } else {
            Write-Host "Database 'the_who' does not exist" -ForegroundColor Red
            Write-Host "Creating database 'the_who'..." -ForegroundColor Yellow
            
            $createDbResult = psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE the_who;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Database 'the_who' created successfully!" -ForegroundColor Green
            } else {
                Write-Host "Failed to create database: $createDbResult" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Cannot connect to PostgreSQL: $psqlResult" -ForegroundColor Red
    }
} catch {
    Write-Host "psql command failed or not found" -ForegroundColor Red
}

Write-Host ""

# Summary and recommendations
Write-Host "=== DIAGNOSIS SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

if ($pgRunning) {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure password 'magarel' is correct for user 'postgres'"
    Write-Host "2. Try running the application:"
    Write-Host "   cd backend"
    Write-Host "   npm run migration:run"
    Write-Host "   npm run start:dev"
} else {
    Write-Host "❌ PostgreSQL is not running or not accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Start PostgreSQL manually" -ForegroundColor Cyan
    Write-Host "- Open Services (services.msc)"
    Write-Host "- Find PostgreSQL service and start it"
    Write-Host "- Or use pgAdmin to start server"
    Write-Host ""
    Write-Host "Option 2: Use Docker PostgreSQL" -ForegroundColor Cyan
    Write-Host "Run this command:"
    Write-Host "docker run -d --name postgres-the-who -e POSTGRES_PASSWORD=magarel -e POSTGRES_DB=the_who -p 5432:5432 postgres:13"
    Write-Host ""
    Write-Host "Option 3: Switch to SQLite (no PostgreSQL needed)" -ForegroundColor Cyan
    Write-Host "Run: .\start-with-sqlite.bat"
}

Write-Host ""
$choice = Read-Host "What would you like to do? (1=Try Docker, 2=Use SQLite, 3=Exit)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting PostgreSQL with Docker..." -ForegroundColor Yellow
        docker run -d --name postgres-the-who -e POSTGRES_PASSWORD=magarel -e POSTGRES_DB=the_who -p 5432:5432 postgres:13
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker PostgreSQL started! Waiting for startup..." -ForegroundColor Green
            Start-Sleep -Seconds 5
            Write-Host "Now try running the application again" -ForegroundColor Green
        } else {
            Write-Host "Docker failed. Make sure Docker Desktop is installed and running." -ForegroundColor Red
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Switching to SQLite..." -ForegroundColor Yellow
        & ".\start-with-sqlite.bat"
    }
    "3" {
        Write-Host "Exiting..." -ForegroundColor Yellow
    }
    default {
        Write-Host "No action taken." -ForegroundColor Yellow
    }
}

Read-Host "Press Enter to exit"
