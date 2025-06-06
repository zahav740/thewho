# Quick script for fast creation and testing of new DB
Write-Host "=== Quick fresh DB thewho creation ===" -ForegroundColor Green

# Stop processes
Write-Host "Stopping processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Set variables
$env:PGPASSWORD = "magarel"

# Remove old DBs
Write-Host "Removing old DBs..." -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS the_who;" 2>$null
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS thewho;" 2>$null

# Create new DB
Write-Host "Creating DB thewho..." -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE thewho;" 2>$null

# Update .env
Write-Host "Updating .env..." -ForegroundColor Yellow
@"
DB_HOST=localhost
DB_PORT=5432  
DB_USERNAME=postgres
DB_PASSWORD=magarel
DB_NAME=thewho
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
"@ | Out-File -FilePath ".\backend\.env" -Encoding UTF8

# Go to backend
cd backend

# Build and migrate
Write-Host "Building and migrating..." -ForegroundColor Yellow
npm run build 2>$null
npm run migration:run 2>$null

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized

cd ..

# Wait for backend
Write-Host "Waiting for backend (30 sec)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check API
Write-Host "Checking API..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    $machines = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 3 -ErrorAction SilentlyContinue
    $orders = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 3 -ErrorAction SilentlyContinue
    
    Write-Host "Health: $(if($health.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($health.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Machines: $(if($machines.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($machines.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Orders: $(if($orders.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($orders.StatusCode -eq 200){'Green'}else{'Red'})
    
    if ($health.StatusCode -eq 200 -and $machines.StatusCode -eq 200 -and $orders.StatusCode -eq 200) {
        Write-Host "`nBACKEND READY!" -ForegroundColor Green
        
        # Start frontend
        Write-Host "Starting frontend..." -ForegroundColor Yellow
        cd frontend
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WindowStyle Minimized
        cd ..
        
        Write-Host "Waiting for frontend (20 sec)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 20
        
        # Check frontend
        try {
            $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($frontend.StatusCode -eq 200) {
                Write-Host "FRONTEND READY!" -ForegroundColor Green
                Write-Host "`nEVERYTHING WORKS!" -ForegroundColor Green
                Write-Host "Opening browser..." -ForegroundColor Cyan
                Start-Process "http://localhost:3001"
            } else {
                Write-Host "Frontend failed to start" -ForegroundColor Red
            }
        } catch {
            Write-Host "Frontend error: $($_)" -ForegroundColor Red
        }
    } else {
        Write-Host "`nBackend API issues" -ForegroundColor Red
    }
} catch {
    Write-Host "Check error: $($_)" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green
