# Direct SQL approach - no migrations
Write-Host "=== Direct SQL DB Setup ===" -ForegroundColor Green

# Stop processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Find PostgreSQL
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}

# Create SQL setup file
$sqlSetup = @"
-- Drop existing database if exists
DROP DATABASE IF EXISTS thewho;
CREATE DATABASE thewho;

-- Connect to thewho database and create tables
\c thewho;

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('MILLING', 'TURNING')),
    axes INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    drawing_number VARCHAR(100) UNIQUE,
    quantity INTEGER NOT NULL,
    deadline DATE NOT NULL,
    priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3, 4)),
    "workType" VARCHAR(200),
    "pdfPath" VARCHAR(500),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create operations table
CREATE TABLE IF NOT EXISTS operations (
    id SERIAL PRIMARY KEY,
    "operationNumber" INTEGER NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "orderId" INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    "machineId" INTEGER REFERENCES machines(id) ON DELETE SET NULL
);

-- Insert test data
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
"@

# Save SQL to file
$sqlFile = "setup_db.sql"
$sqlSetup | Out-File -FilePath $sqlFile -Encoding UTF8

# Update .env
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

# Try to execute SQL
Write-Host "Setting up database..." -ForegroundColor Yellow
$env:PGPASSWORD = "magarel"

# Find PostgreSQL bin directory
$pgBin = $null
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $pgBin = Split-Path $resolved.Path -Parent
        break
    }
}

if ($pgBin) {
    Write-Host "Found PostgreSQL at: $pgBin" -ForegroundColor Green
    $psqlPath = Join-Path $pgBin "psql.exe"
    
    try {
        & $psqlPath -h localhost -p 5432 -U postgres -f $sqlFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database setup completed!" -ForegroundColor Green
        } else {
            Write-Host "Database setup failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error running SQL: $($_)" -ForegroundColor Red
    }
} else {
    Write-Host "PostgreSQL not found!" -ForegroundColor Red
    Write-Host "Please run this SQL manually in pgAdmin or psql:" -ForegroundColor Yellow
    Write-Host $sqlSetup -ForegroundColor Cyan
}

# Clean up
Remove-Item $sqlFile -ErrorAction SilentlyContinue

# Remove old migrations to avoid conflicts
$migrationsPath = ".\backend\src\database\migrations"
if (Test-Path $migrationsPath) {
    Remove-Item -Path "$migrationsPath\*.ts" -Force -ErrorAction SilentlyContinue
    Write-Host "Old migrations removed" -ForegroundColor Green
}

# Create empty migrations table entry
if ($pgBin) {
    try {
        & $psqlPath -h localhost -p 5432 -U postgres -d thewho -c "CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, timestamp BIGINT, name VARCHAR(255));"
        Write-Host "Migrations table created" -ForegroundColor Green
    } catch {
        Write-Host "Could not create migrations table" -ForegroundColor Yellow
    }
}

# Build and start backend
Write-Host "Building backend..." -ForegroundColor Yellow
cd backend

npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend built successfully" -ForegroundColor Green
    
    # Start backend
    Write-Host "Starting backend..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized
    
    cd ..
    
    # Wait and test
    Write-Host "Waiting 30 seconds for backend..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $machines = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $orders = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Host "`nAPI Status:" -ForegroundColor Cyan
        Write-Host "Health: $(if($health.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($health.StatusCode -eq 200){'Green'}else{'Red'})
        Write-Host "Machines: $(if($machines.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($machines.StatusCode -eq 200){'Green'}else{'Red'})
        Write-Host "Orders: $(if($orders.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($orders.StatusCode -eq 200){'Green'}else{'Red'})
        
        if ($health.StatusCode -eq 200 -and $machines.StatusCode -eq 200 -and $orders.StatusCode -eq 200) {
            Write-Host "`nSUCCESS! Starting frontend..." -ForegroundColor Green
            
            cd frontend
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WindowStyle Minimized
            cd ..
            
            Start-Sleep -Seconds 20
            
            try {
                $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($frontend.StatusCode -eq 200) {
                    Write-Host "EVERYTHING WORKS! Opening browser..." -ForegroundColor Green
                    Start-Process "http://localhost:3001"
                }
            } catch {
                Write-Host "Frontend may still be loading..." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "API test failed: $($_)" -ForegroundColor Red
    }
} else {
    Write-Host "Backend build failed" -ForegroundColor Red
    cd ..
}

Write-Host "`nDone!" -ForegroundColor Green
