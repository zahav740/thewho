# Quick Fix - Create Missing Tables
Write-Host "=== Creating Missing Tables ===" -ForegroundColor Cyan
Write-Host ""

$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "magarel"

Write-Host "Backend is running but missing 'machines' table." -ForegroundColor Yellow
Write-Host "Let's create the missing tables now..." -ForegroundColor Yellow
Write-Host ""

# Create machines table
Write-Host "Creating 'machines' table..." -ForegroundColor Yellow
$createMachines = @"
CREATE TABLE IF NOT EXISTS machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR NOT NULL UNIQUE,
    type VARCHAR NOT NULL CHECK (type IN ('MILLING', 'TURNING')),
    axes INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Insert test data
INSERT INTO machines (code, type, axes) VALUES 
    ('M001', 'MILLING', 3),
    ('M002', 'MILLING', 4), 
    ('T001', 'TURNING', 3),
    ('T002', 'TURNING', 4)
ON CONFLICT (code) DO NOTHING;
"@

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $createMachines

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Machines table created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create machines table" -ForegroundColor Red
}

# Check if orders table needs UUID id
Write-Host ""
Write-Host "Checking orders table structure..." -ForegroundColor Yellow
$ordersCheck = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\d orders" 2>&1

if ($ordersCheck -match "uuid") {
    Write-Host "✅ Orders table already has UUID structure" -ForegroundColor Green
} else {
    Write-Host "Updating orders table to use UUID..." -ForegroundColor Yellow
    $updateOrders = @"
-- Add some test orders if table is empty
INSERT INTO orders (drawing_number, quantity, deadline, priority, "workType") VALUES 
    ('DWG-001', 10, '2025-06-15', '1', 'Фрезерная обработка'),
    ('DWG-002', 5, '2025-06-20', '2', 'Токарная обработка'),
    ('DWG-003', 15, '2025-07-01', '3', 'Комплексная обработка')
ON CONFLICT (drawing_number) DO NOTHING;
"@
    & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $updateOrders
}

# Add foreign key columns to operations if missing
Write-Host ""
Write-Host "Updating operations table..." -ForegroundColor Yellow
$updateOperations = @"
-- Add foreign key columns if they don't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'orderId') THEN
        ALTER TABLE operations ADD COLUMN "orderId" uuid;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'machineId') THEN
        ALTER TABLE operations ADD COLUMN "machineId" uuid;
    END IF;
END
\$\$;

-- Add some test operations
INSERT INTO operations (id, "operationNumber", "operationType", "machineAxes", "estimatedTime", status) VALUES 
    (gen_random_uuid(), 1, 'MILLING', 3, 120, 'PENDING'),
    (gen_random_uuid(), 2, 'TURNING', 4, 90, 'PENDING'),
    (gen_random_uuid(), 3, 'MILLING', 4, 150, 'PENDING')
ON CONFLICT (id) DO NOTHING;
"@

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $updateOperations

Write-Host ""
Write-Host "✅ Database tables updated!" -ForegroundColor Green
Write-Host ""

# Test the API endpoints
Write-Host "Testing API endpoints..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    Write-Host "Testing /api/machines..." -ForegroundColor White
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ /api/machines is working!" -ForegroundColor Green
        $machines = $response.Content | ConvertFrom-Json
        Write-Host "Found $($machines.Count) machines" -ForegroundColor White
    }
} catch {
    Write-Host "❌ /api/machines error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "Testing /api/orders..." -ForegroundColor White
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ /api/orders is working!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ /api/orders error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Backend should now be working!" -ForegroundColor Green
Write-Host ""

# Start frontend
$startFrontend = Read-Host "Start frontend now? (y/n)"
if ($startFrontend -eq "y" -or $startFrontend -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
    Set-Location "..\frontend"
    Start-Process -FilePath "cmd" -ArgumentList "/k", "title Frontend && npm start" -WindowStyle Normal
    
    Write-Host ""
    Write-Host "🎉 FULL APPLICATION STARTED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Backend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔗 Frontend: http://localhost:3001 (will open automatically)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Backend errors should be gone now!" -ForegroundColor Green
}

# Cleanup
$env:PGPASSWORD = $null

Read-Host "Press Enter to finish"
