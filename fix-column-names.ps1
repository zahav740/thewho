# Fix Column Names - Final Step
Write-Host "=== Fixing Column Names ===" -ForegroundColor Cyan
Write-Host ""

$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "magarel"

Write-Host "Backend found machines table but column names are wrong!" -ForegroundColor Yellow
Write-Host "Fixing column names to match TypeORM expectations..." -ForegroundColor Yellow
Write-Host ""

# Fix machines table column names
Write-Host "Step 1: Fixing machines table columns..." -ForegroundColor Yellow

# Rename columns to match TypeORM expectations
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE machines RENAME COLUMN isactive TO \"isActive\";"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE machines RENAME COLUMN isoccupied TO \"isOccupied\";"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE machines RENAME COLUMN createdat TO \"createdAt\";"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE machines RENAME COLUMN updatedat TO \"updatedAt\";"

Write-Host "Step 2: Checking if machines table looks correct now..." -ForegroundColor Yellow
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\d machines"

Write-Host ""
Write-Host "Step 3: Testing API call..." -ForegroundColor Yellow

# Test API call
Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "🎉 SUCCESS! /api/machines is working!" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "Found $($data.Count) machines:" -ForegroundColor White
        foreach ($machine in $data) {
            Write-Host "  - $($machine.code): $($machine.type) ($($machine.axes) axes)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Still error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Let's check what the actual table structure is:" -ForegroundColor Yellow
    & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'machines' ORDER BY ordinal_position;"
}

Write-Host ""
Write-Host "Step 4: Let's also fix other potential issues..." -ForegroundColor Yellow

# Add missing columns with proper names if they don't exist
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS \"createdAt\" TIMESTAMP DEFAULT now();"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE operations ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP DEFAULT now();"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS \"createdAt\" TIMESTAMP DEFAULT now();"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP DEFAULT now();"
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "ALTER TABLE orders ADD COLUMN IF NOT EXISTS \"pdfPath\" VARCHAR;"

Write-Host ""
Write-Host "✅ Column fixes completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Check your frontend now - it should be working!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan

$env:PGPASSWORD = $null

Read-Host "Press Enter to finish"
