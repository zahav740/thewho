# Simple Table Creation - Fixed SQL
Write-Host "=== Creating Tables with Simple SQL ===" -ForegroundColor Cyan
Write-Host ""

$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "magarel"

Write-Host "Step 1: Creating machines table..." -ForegroundColor Yellow
$createMachines = "CREATE TABLE IF NOT EXISTS machines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR NOT NULL UNIQUE, type VARCHAR NOT NULL, axes INTEGER NOT NULL, isActive BOOLEAN DEFAULT true, isOccupied BOOLEAN DEFAULT false, createdAt TIMESTAMP DEFAULT now(), updatedAt TIMESTAMP DEFAULT now());"

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $createMachines

Write-Host "Step 2: Adding test machines..." -ForegroundColor Yellow
$insertMachines = "INSERT INTO machines (code, type, axes) VALUES ('M001', 'MILLING', 3), ('M002', 'MILLING', 4), ('T001', 'TURNING', 3) ON CONFLICT (code) DO NOTHING;"

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $insertMachines

Write-Host "Step 3: Adding columns to operations..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS orderId uuid;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS machineId uuid;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS operationType VARCHAR DEFAULT 'MILLING';"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'PENDING';"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS operationNumber INTEGER DEFAULT 1;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS machineAxes INTEGER DEFAULT 3;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS estimatedTime INTEGER DEFAULT 60;"

Write-Host "Step 4: Adding columns to orders..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS drawing_number VARCHAR;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT CURRENT_DATE + INTERVAL '30 days';"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT '3';"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS workType VARCHAR;"

Write-Host "Step 5: Creating shift_records..." -ForegroundColor Yellow
$createShiftRecords = "CREATE TABLE IF NOT EXISTS shift_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), date DATE NOT NULL, shiftType VARCHAR DEFAULT 'DAY', setupStartDate DATE, setupOperator VARCHAR, setupType VARCHAR, setupTime INTEGER, dayShiftQuantity INTEGER, dayShiftOperator VARCHAR, dayShiftTimePerUnit NUMERIC(10,2), nightShiftQuantity INTEGER, nightShiftOperator VARCHAR DEFAULT 'Аркадий', nightShiftTimePerUnit NUMERIC(10,2), createdAt TIMESTAMP DEFAULT now(), operationId uuid, machineId uuid);"

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $createShiftRecords

Write-Host "Step 6: Adding test orders..." -ForegroundColor Yellow
$insertOrders = "INSERT INTO orders (drawing_number, quantity, deadline, priority, workType) VALUES ('DWG-001', 10, '2025-06-15', '1', 'Фрезерная обработка'), ('DWG-002', 5, '2025-06-20', '2', 'Токарная обработка') ON CONFLICT (drawing_number) DO NOTHING;"

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $insertOrders

Write-Host ""
Write-Host "✅ All commands executed!" -ForegroundColor Green
Write-Host ""

# Check what we created
Write-Host "Checking machines table..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "SELECT COUNT(*) as machines_count FROM machines;"

Write-Host ""
Write-Host "🔄 NOW RESTART BACKEND!" -ForegroundColor Red
Write-Host "1. Go to backend terminal" -ForegroundColor White
Write-Host "2. Press Ctrl+C to stop" -ForegroundColor White  
Write-Host "3. Run: npm run start:dev" -ForegroundColor White
Write-Host ""

$env:PGPASSWORD = $null

Read-Host "Press Enter after restarting backend"
