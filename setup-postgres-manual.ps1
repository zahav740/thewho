# PostgreSQL Manual Setup and Start
Write-Host "=== PostgreSQL Manual Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if PostgreSQL is installed
Write-Host "1. Checking PostgreSQL installation..." -ForegroundColor Yellow

# Common PostgreSQL installation paths
$pgPaths = @(
    "C:\Program Files\PostgreSQL\*\bin",
    "C:\Program Files (x86)\PostgreSQL\*\bin", 
    "${env:ProgramFiles}\PostgreSQL\*\bin",
    "${env:ProgramFiles(x86)}\PostgreSQL\*\bin"
)

$pgBinPath = $null
foreach ($path in $pgPaths) {
    $resolvedPaths = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolvedPaths) {
        foreach ($resolvedPath in $resolvedPaths) {
            if (Test-Path "$resolvedPath\psql.exe") {
                $pgBinPath = $resolvedPath
                Write-Host "Found PostgreSQL at: $pgBinPath" -ForegroundColor Green
                break
            }
        }
        if ($pgBinPath) { break }
    }
}

if (-not $pgBinPath) {
    Write-Host "PostgreSQL not found in standard locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Is PostgreSQL installed?"
    Write-Host "2. Download from: https://www.postgresql.org/download/windows/"
    Write-Host "3. Or check if it's installed elsewhere"
    Write-Host ""
    
    # Try to find psql in PATH
    try {
        $psqlPath = Get-Command psql -ErrorAction Stop
        Write-Host "Found psql in PATH: $($psqlPath.Source)" -ForegroundColor Green
        $pgBinPath = Split-Path $psqlPath.Source
    } catch {
        Write-Host "psql not found in PATH either" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Step 2: Check and start PostgreSQL service
Write-Host "2. Checking PostgreSQL service..." -ForegroundColor Yellow

$services = Get-Service | Where-Object {$_.Name -like "*postgresql*" -or $_.DisplayName -like "*PostgreSQL*"}
if ($services) {
    foreach ($service in $services) {
        Write-Host "Service: $($service.DisplayName) - Status: $($service.Status)" -ForegroundColor White
        
        if ($service.Status -eq "Stopped") {
            Write-Host "Attempting to start service: $($service.Name)" -ForegroundColor Yellow
            try {
                Start-Service $service.Name
                Write-Host "✅ Service started successfully" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start service: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "Try running as Administrator" -ForegroundColor Yellow
            }
        } elseif ($service.Status -eq "Running") {
            Write-Host "✅ Service is already running" -ForegroundColor Green
        }
    }
} else {
    Write-Host "No PostgreSQL service found" -ForegroundColor Red
    Write-Host "PostgreSQL might be installed as a standalone application" -ForegroundColor Yellow
    
    # Try to start PostgreSQL manually
    Write-Host ""
    Write-Host "3. Attempting to start PostgreSQL manually..." -ForegroundColor Yellow
    
    $dataDir = "$pgBinPath\..\data"
    if (Test-Path $dataDir) {
        Write-Host "Found data directory: $dataDir" -ForegroundColor Green
        try {
            & "$pgBinPath\pg_ctl.exe" start -D $dataDir
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PostgreSQL started manually" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to start PostgreSQL manually" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Error starting PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Data directory not found at: $dataDir" -ForegroundColor Red
    }
}

Write-Host ""

# Step 3: Test connection
Write-Host "4. Testing PostgreSQL connection..." -ForegroundColor Yellow

# Set environment variable for password (to avoid prompt)
$env:PGPASSWORD = "magarel"

try {
    # Test connection to default postgres database
    $result = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully connected to PostgreSQL" -ForegroundColor Green
        Write-Host ""
        
        # Check if the_who database exists
        Write-Host "5. Checking database 'the_who'..." -ForegroundColor Yellow
        $dbCheck = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'the_who';" -t 2>&1
        
        if ($dbCheck -match "1") {
            Write-Host "✅ Database 'the_who' exists" -ForegroundColor Green
        } else {
            Write-Host "Database 'the_who' not found. Creating..." -ForegroundColor Yellow
            $createResult = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE the_who;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database 'the_who' created successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to create database: $createResult" -ForegroundColor Red
            }
        }
        
        # Test connection to the_who database
        Write-Host ""
        Write-Host "6. Testing connection to 'the_who'..." -ForegroundColor Yellow
        $theWhoTest = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully connected to 'the_who' database" -ForegroundColor Green
            
            # Show existing tables
            Write-Host ""
            Write-Host "Existing tables in 'the_who':" -ForegroundColor Cyan
            & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\dt" 2>&1
            
        } else {
            Write-Host "❌ Failed to connect to 'the_who': $theWhoTest" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Failed to connect to PostgreSQL: $result" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "1. Wrong password (current: magarel)"
        Write-Host "2. PostgreSQL not running"
        Write-Host "3. Port 5432 not accessible"
        Write-Host "4. User 'postgres' doesn't exist"
    }
} catch {
    Write-Host "❌ Error testing connection: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL is working!" -ForegroundColor Green
    Write-Host ""
    $runMigrations = Read-Host "Run database migrations now? (y/n)"
    if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
        Write-Host ""
        Write-Host "Running migrations..." -ForegroundColor Yellow
        Set-Location "backend"
        npm run migration:run
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations completed!" -ForegroundColor Green
            
            $startApp = Read-Host "Start the application? (y/n)"
            if ($startApp -eq "y" -or $startApp -eq "Y") {
                Write-Host "Starting backend..." -ForegroundColor Yellow
                Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev"
                
                Write-Host "Starting frontend..." -ForegroundColor Yellow
                Set-Location "..\frontend"
                Start-Sleep -Seconds 2
                Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start"
                
                Write-Host ""
                Write-Host "🚀 Application started!" -ForegroundColor Green
                Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
                Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
            }
        }
    }
} else {
    Write-Host "❌ PostgreSQL issues detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Fix PostgreSQL installation and configuration"
    Write-Host "2. Use SQLite instead (run: .\start-with-sqlite.bat)"
    Write-Host "3. Install PostgreSQL fresh from official website"
}

Read-Host "Press Enter to exit"
