# URGENT - Create Tables NOW
Write-Host "=== URGENT - Creating Tables RIGHT NOW ===" -ForegroundColor Red
Write-Host ""

$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "magarel"

Write-Host "Creating ALL missing tables immediately..." -ForegroundColor Yellow

# Create all tables in one go
$createAllTables = @"
-- 1. Create machines table
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

-- Insert test machines
INSERT INTO machines (code, type, axes) VALUES 
    ('M001', 'MILLING', 3),
    ('M002', 'MILLING', 4), 
    ('T001', 'TURNING', 3),
    ('T002', 'TURNING', 4)
ON CONFLICT (code) DO NOTHING;

-- 2. Add missing columns to operations if needed
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'orderId') THEN
        ALTER TABLE operations ADD COLUMN "orderId" uuid;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'machineId') THEN
        ALTER TABLE operations ADD COLUMN "machineId" uuid;
    END IF;
    
    -- Add missing enum columns if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationType') THEN
        ALTER TABLE operations ADD COLUMN "operationType" VARCHAR DEFAULT 'MILLING';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'status') THEN
        ALTER TABLE operations ADD COLUMN status VARCHAR DEFAULT 'PENDING';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'operationNumber') THEN
        ALTER TABLE operations ADD COLUMN "operationNumber" INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'machineAxes') THEN
        ALTER TABLE operations ADD COLUMN "machineAxes" INTEGER DEFAULT 3;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'estimatedTime') THEN
        ALTER TABLE operations ADD COLUMN "estimatedTime" INTEGER DEFAULT 60;
    END IF;
END
\$\$;

-- 3. Add missing columns to orders if needed
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'drawing_number') THEN
        ALTER TABLE orders ADD COLUMN drawing_number VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'quantity') THEN
        ALTER TABLE orders ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deadline') THEN
        ALTER TABLE orders ADD COLUMN deadline DATE DEFAULT CURRENT_DATE + INTERVAL '30 days';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'priority') THEN
        ALTER TABLE orders ADD COLUMN priority VARCHAR DEFAULT '3';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'workType') THEN
        ALTER TABLE orders ADD COLUMN "workType" VARCHAR;
    END IF;
END
\$\$;

-- 4. Create shift_records table if missing (rename from shifts)
CREATE TABLE IF NOT EXISTS shift_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    "shiftType" VARCHAR NOT NULL DEFAULT 'DAY',
    "setupStartDate" DATE,
    "setupOperator" VARCHAR,
    "setupType" VARCHAR,
    "setupTime" INTEGER,
    "dayShiftQuantity" INTEGER,
    "dayShiftOperator" VARCHAR,
    "dayShiftTimePerUnit" NUMERIC(10,2),
    "nightShiftQuantity" INTEGER,
    "nightShiftOperator" VARCHAR DEFAULT 'Аркадий',
    "nightShiftTimePerUnit" NUMERIC(10,2),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "operationId" uuid,
    "machineId" uuid
);

-- 5. Insert some test data
INSERT INTO orders (drawing_number, quantity, deadline, priority, "workType") VALUES 
    ('DWG-001', 10, '2025-06-15', '1', 'Фрезерная обработка'),
    ('DWG-002', 5, '2025-06-20', '2', 'Токарная обработка'),
    ('DWG-003', 15, '2025-07-01', '3', 'Комплексная обработка')
ON CONFLICT (drawing_number) DO NOTHING;

SELECT 'SUCCESS: All tables created!' as result;
"@

Write-Host "Executing SQL commands..." -ForegroundColor Yellow
$result = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $createAllTables

Write-Host $result -ForegroundColor Green

Write-Host ""
Write-Host "✅ TABLES CREATED! Testing API now..." -ForegroundColor Green

# Test API immediately
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "🎉 SUCCESS! /api/machines is working!" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Found machines: $($data.Length)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Still error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Backend might need restart..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 If API still has errors, restart backend:" -ForegroundColor Yellow
Write-Host "Ctrl+C in backend terminal, then: npm run start:dev" -ForegroundColor White

$env:PGPASSWORD = $null
