# Create fresh database thewho - English version
# This script will completely recreate the database and set up everything from scratch

Write-Host "=== Creating fresh database thewho ===" -ForegroundColor Green

# Stop all processes
Write-Host "`n1. Stopping all processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Processes stopped" -ForegroundColor Green

# Start PostgreSQL
Write-Host "`n2. Starting PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 5
        Write-Host "PostgreSQL started" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL already running" -ForegroundColor Green
    }
} catch {
    Write-Host "Error starting PostgreSQL: $($_)" -ForegroundColor Red
    Write-Host "Please start PostgreSQL manually" -ForegroundColor Yellow
    return
}

# Remove old databases
Write-Host "`n3. Removing old databases..." -ForegroundColor Yellow
$env:PGPASSWORD = "magarel"
try {
    # Close all connections to old databases
    psql -h localhost -p 5432 -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname IN ('the_who', 'thewho') AND pid <> pg_backend_pid();" 2>$null
    
    # Drop old databases
    dropdb -h localhost -p 5432 -U postgres the_who 2>$null
    dropdb -h localhost -p 5432 -U postgres thewho 2>$null
    Write-Host "Old databases removed" -ForegroundColor Green
} catch {
    Write-Host "Previous databases not found or already removed" -ForegroundColor Yellow
}

# Create new database
Write-Host "`n4. Creating new database thewho..." -ForegroundColor Yellow
try {
    createdb -h localhost -p 5432 -U postgres thewho
    Write-Host "Database thewho created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating database: $($_)" -ForegroundColor Red
    return
}

# Update backend settings
Write-Host "`n5. Updating backend settings..." -ForegroundColor Yellow
$envPath = ".\backend\.env"
$envContent = @"
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=magarel
DB_NAME=thewho

# Application
PORT=3000
NODE_ENV=development

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
"@

$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "File .env updated" -ForegroundColor Green

# Go to backend directory
Push-Location .\backend

# Build backend
Write-Host "`n6. Building backend..." -ForegroundColor Yellow
try {
    npm run build 2>build_errors.log
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend built successfully" -ForegroundColor Green
    } else {
        Write-Host "Build errors - see build_errors.log" -ForegroundColor Red
        Get-Content build_errors.log | Select-Object -Last 10
    }
} catch {
    Write-Host "Build error: $($_)" -ForegroundColor Red
}

# Run migrations
Write-Host "`n7. Running migrations..." -ForegroundColor Yellow
try {
    npm run migration:run 2>migration_errors.log
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "Migration errors - see migration_errors.log" -ForegroundColor Red
        Get-Content migration_errors.log | Select-Object -Last 10
    }
} catch {
    Write-Host "Migration error: $($_)" -ForegroundColor Red
}

Pop-Location

# Check database structure
Write-Host "`n8. Checking database structure..." -ForegroundColor Yellow
try {
    $tables = psql -h localhost -p 5432 -U postgres -d thewho -c "\dt" 2>$null
    if ($tables) {
        Write-Host "Tables created successfully:" -ForegroundColor Green
        Write-Host $tables -ForegroundColor Cyan
    } else {
        Write-Host "Tables not found" -ForegroundColor Red
    }
} catch {
    Write-Host "Error checking tables: $($_)" -ForegroundColor Red
}

# Add test data via SQL file
Write-Host "`n9. Adding test data..." -ForegroundColor Yellow
$testDataFile = "test_data.sql"
$testDataSQL = @"
INSERT INTO machines (code, type, axes, "isActive", "isOccupied") VALUES
('M001', 'MILLING', 3, true, false),
('M002', 'MILLING', 4, true, false),
('T001', 'TURNING', 3, true, false),
('T002', 'TURNING', 4, true, false);

INSERT INTO orders (drawing_number, quantity, deadline, priority, "workType") VALUES
('DWG-001', 10, '2025-06-15', 1, 'Milling operation'),
('DWG-002', 5, '2025-06-20', 2, 'Turning operation'),
('DWG-003', 15, '2025-07-01', 3, 'Complex machining');

INSERT INTO operations ("operationNumber", "estimatedTime", status, "orderId", "machineId") VALUES
(10, 120, 'PENDING', 1, 1),
(20, 90, 'PENDING', 1, 2),
(10, 180, 'PENDING', 2, 3),
(10, 240, 'PENDING', 3, 1);
"@

try {
    $testDataSQL | Out-File -FilePath $testDataFile -Encoding UTF8
    psql -h localhost -p 5432 -U postgres -d thewho -f $testDataFile 2>test_data_errors.log
    Remove-Item $testDataFile -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Test data added successfully" -ForegroundColor Green
    } else {
        Write-Host "Test data errors - see test_data_errors.log" -ForegroundColor Red
    }
} catch {
    Write-Host "Error adding test data: $($_)" -ForegroundColor Red
}

# Start backend
Write-Host "`n10. Starting backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$PWD\backend`" && npm run start:dev" -WindowStyle Minimized

# Wait for backend startup
Write-Host "Waiting for backend startup..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 12; $i++) {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend ready!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "Waiting... ($($i*5+5)s)" -ForegroundColor Yellow
    }
}

if (-not $backendReady) {
    Write-Host "Backend failed to start. Check logs." -ForegroundColor Red
    return
}

# Start frontend
Write-Host "`n11. Starting frontend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$PWD\frontend`" && npm start" -WindowStyle Minimized

# Wait for frontend
Write-Host "Waiting for frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Final check
Write-Host "`n12. Final check..." -ForegroundColor Yellow
try {
    # Check API endpoints
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $machinesCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $ordersCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    Write-Host "`nCheck results:" -ForegroundColor Cyan
    Write-Host "Health API: $(if($healthCheck.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($healthCheck.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Machines API: $(if($machinesCheck.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($machinesCheck.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Orders API: $(if($ordersCheck.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($ordersCheck.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Frontend: $(if($frontendCheck.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($frontendCheck.StatusCode -eq 200){'Green'}else{'Red'})
    
    if ($healthCheck.StatusCode -eq 200 -and $machinesCheck.StatusCode -eq 200 -and $ordersCheck.StatusCode -eq 200 -and $frontendCheck.StatusCode -eq 200) {
        Write-Host "`nALL READY!" -ForegroundColor Green
        Write-Host "Database thewho created and configured" -ForegroundColor Green
        Write-Host "All APIs working correctly" -ForegroundColor Green
        Write-Host "`nOpen browser: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "API docs: http://localhost:3000/api/docs" -ForegroundColor Cyan
        Write-Host "Health check: http://localhost:3000/api/health" -ForegroundColor Cyan
        
        # Open browser
        Start-Process "http://localhost:3001"
    } else {
        Write-Host "`nSome services have issues" -ForegroundColor Red
        Write-Host "Check backend and frontend terminal logs" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Final check error: $($_)" -ForegroundColor Red
}

Write-Host "`n=== Setup completed ===" -ForegroundColor Green
