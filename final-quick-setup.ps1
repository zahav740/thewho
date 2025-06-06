# Quick setup since PostgreSQL is working and DB exists
Write-Host "=== Quick setup for existing thewho DB ===" -ForegroundColor Green

# Navigate to project directory
cd "C:\Users\Alexey\Downloads\TheWho\production-crm"

# Stop any running processes
Write-Host "Stopping processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Set PostgreSQL password
$env:PGPASSWORD = "magarel"

# Create SQL setup
$sqlSetup = @"
-- Clean up existing tables
DROP TABLE IF EXISTS shift_records CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Create machines table
CREATE TABLE machines (
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
CREATE TABLE orders (
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
CREATE TABLE operations (
    id SERIAL PRIMARY KEY,
    "operationNumber" INTEGER NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "orderId" INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    "machineId" INTEGER REFERENCES machines(id) ON DELETE SET NULL
);

-- Create shift_records table (basic version)
CREATE TABLE shift_records (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    "shiftType" VARCHAR(10) NOT NULL CHECK ("shiftType" IN ('DAY', 'NIGHT')),
    "dayShiftQuantity" INTEGER,
    "nightShiftQuantity" INTEGER,
    "dayShiftOperator" VARCHAR(100),
    "nightShiftOperator" VARCHAR(100),
    "setupTime" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "operationId" INTEGER REFERENCES operations(id) ON DELETE CASCADE,
    "machineId" INTEGER REFERENCES machines(id) ON DELETE CASCADE
);

-- Insert test data
INSERT INTO machines (code, type, axes, "isActive", "isOccupied") VALUES
('M001', 'MILLING', 3, true, false),
('M002', 'MILLING', 4, true, false),
('T001', 'TURNING', 3, true, false),
('T002', 'TURNING', 4, true, false),
('M003', 'MILLING', 3, true, true);

INSERT INTO orders (drawing_number, quantity, deadline, priority, "workType") VALUES
('DWG-001', 10, '2025-06-15', 1, 'Milling operation for housing'),
('DWG-002', 5, '2025-06-20', 2, 'Turning operation for shaft'),
('DWG-003', 15, '2025-07-01', 3, 'Complex machining'),
('DWG-004', 8, '2025-06-10', 1, 'Critical milling part');

INSERT INTO operations ("operationNumber", "estimatedTime", status, "orderId", "machineId") VALUES
(10, 120, 'PENDING', 1, 1),
(20, 90, 'PENDING', 1, 2),
(10, 180, 'IN_PROGRESS', 2, 3),
(10, 240, 'PENDING', 3, 1),
(20, 150, 'COMPLETED', 3, 2),
(10, 200, 'PENDING', 4, 4);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_active ON machines("isActive");
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);

-- Create migrations table to prevent migration conflicts
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL
);
"@

# Save and execute SQL
Write-Host "Setting up database schema..." -ForegroundColor Yellow
$sqlFile = "quick_setup.sql"
$sqlSetup | Out-File -FilePath $sqlFile -Encoding UTF8

try {
    psql -U postgres -h localhost -d thewho -f $sqlFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database setup failed" -ForegroundColor Red
        return
    }
} catch {
    Write-Host "Error setting up database: $($_)" -ForegroundColor Red
    return
} finally {
    Remove-Item $sqlFile -ErrorAction SilentlyContinue
}

# Update .env file
Write-Host "Updating .env..." -ForegroundColor Yellow
$envContent = @"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=magarel
DB_NAME=thewho
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
"@
$envContent | Out-File -FilePath ".\backend\.env" -Encoding UTF8

# Clean migrations folder to avoid conflicts
Write-Host "Cleaning migrations..." -ForegroundColor Yellow
$migrationsPath = ".\backend\src\database\migrations"
if (Test-Path $migrationsPath) {
    Remove-Item -Path "$migrationsPath\*.ts" -Force -ErrorAction SilentlyContinue
    Write-Host "Old migrations removed" -ForegroundColor Green
}

# Build backend
Write-Host "Building backend..." -ForegroundColor Yellow
cd backend
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend built successfully!" -ForegroundColor Green
    } else {
        Write-Host "Backend build failed" -ForegroundColor Red
        cd ..
        return
    }
} catch {
    Write-Host "Build error: $($_)" -ForegroundColor Red
    cd ..
    return
}

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized
cd ..

# Wait for backend
Write-Host "Waiting for backend (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Test backend APIs
Write-Host "Testing APIs..." -ForegroundColor Yellow
$allGood = $true

try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $machines = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $orders = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    Write-Host "`nAPI Status:" -ForegroundColor Cyan
    Write-Host "Health: $(if($health.StatusCode -eq 200){'✓ OK'}else{'✗ ERROR'})" -ForegroundColor $(if($health.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Machines: $(if($machines.StatusCode -eq 200){'✓ OK'}else{'✗ ERROR'})" -ForegroundColor $(if($machines.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Orders: $(if($orders.StatusCode -eq 200){'✓ OK'}else{'✗ ERROR'})" -ForegroundColor $(if($orders.StatusCode -eq 200){'Green'}else{'Red'})
    
    if ($health.StatusCode -ne 200 -or $machines.StatusCode -ne 200 -or $orders.StatusCode -ne 200) {
        $allGood = $false
    }
} catch {
    Write-Host "API test failed: $($_)" -ForegroundColor Red
    $allGood = $false
}

if ($allGood) {
    Write-Host "`n🎉 BACKEND IS WORKING! 🎉" -ForegroundColor Green
    
    # Start frontend
    Write-Host "Starting frontend..." -ForegroundColor Yellow
    cd frontend
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WindowStyle Minimized
    cd ..
    
    Write-Host "Waiting for frontend (25 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 25
    
    # Test frontend
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($frontend.StatusCode -eq 200) {
            Write-Host "🎉 FRONTEND IS WORKING! 🎉" -ForegroundColor Green
            Write-Host "`n✅ EVERYTHING IS READY! ✅" -ForegroundColor Green
            Write-Host "`nApplication URLs:" -ForegroundColor Cyan
            Write-Host "• Main app: http://localhost:3001" -ForegroundColor White
            Write-Host "• API docs: http://localhost:3000/api/docs" -ForegroundColor White
            Write-Host "• Health check: http://localhost:3000/api/health" -ForegroundColor White
            
            Write-Host "`nOpening browser..." -ForegroundColor Green
            Start-Process "http://localhost:3001"
        } else {
            Write-Host "Frontend not ready yet - try opening http://localhost:3001 manually" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Frontend still loading - try http://localhost:3001 in a minute" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nBackend APIs have issues. Check the terminal logs." -ForegroundColor Red
}

Write-Host "`nSetup completed!" -ForegroundColor Green
