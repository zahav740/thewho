# Docker PostgreSQL Setup for Production CRM
Write-Host "=== Setting up PostgreSQL with Docker ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
Write-Host "Checking Docker availability..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is available" -ForegroundColor Green
    } else {
        throw "Docker not available"
    }
} catch {
    Write-Host "❌ Docker is not available" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Stop and remove existing container if exists
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker stop postgres-the-who 2>&1 | Out-Null
docker rm postgres-the-who 2>&1 | Out-Null

# Start new PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
Write-Host "Database: the_who" -ForegroundColor White
Write-Host "User: postgres" -ForegroundColor White  
Write-Host "Password: magarel" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White
Write-Host ""

$dockerCmd = "docker run -d --name postgres-the-who -e POSTGRES_PASSWORD=magarel -e POSTGRES_DB=the_who -p 5432:5432 postgres:13"
Invoke-Expression $dockerCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL container started!" -ForegroundColor Green
    Write-Host ""
    
    # Wait for PostgreSQL to be ready
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 30
    
    do {
        Start-Sleep -Seconds 2
        $attempts++
        $ready = docker exec postgres-the-who pg_isready -U postgres 2>&1
        Write-Host "Attempt $attempts/$maxAttempts..." -ForegroundColor Gray
    } while ($LASTEXITCODE -ne 0 -and $attempts -lt $maxAttempts)
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
        Write-Host ""
        
        # Test connection
        Write-Host "Testing connection..." -ForegroundColor Yellow
        $testResult = psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT 'Connection successful!' as status;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connection test successful!" -ForegroundColor Green
            Write-Host ""
            
            # Ask to run migrations and start app
            $runApp = Read-Host "Run migrations and start application? (y/n)"
            if ($runApp -eq "y" -or $runApp -eq "Y") {
                Write-Host ""
                Write-Host "Running migrations..." -ForegroundColor Yellow
                Set-Location "backend"
                npm run migration:run
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Migrations completed!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Starting application..." -ForegroundColor Yellow
                    
                    # Start backend
                    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev"
                    
                    # Start frontend
                    Start-Sleep -Seconds 3
                    Set-Location "..\frontend"
                    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start"
                    
                    Write-Host ""
                    Write-Host "🚀 Application started!" -ForegroundColor Green
                    Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
                    Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
                    Write-Host ""
                    Write-Host "Docker commands:" -ForegroundColor Yellow
                    Write-Host "Stop:  docker stop postgres-the-who"
                    Write-Host "Start: docker start postgres-the-who"
                    Write-Host "Remove: docker rm postgres-the-who"
                } else {
                    Write-Host "❌ Migration failed" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "❌ Connection test failed: $testResult" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ PostgreSQL failed to start within timeout" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
