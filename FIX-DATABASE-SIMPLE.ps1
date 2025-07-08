# QUICK DATABASE FIX - SIMPLE VERSION
Write-Host "QUICK DATABASE FIX" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

Write-Host ""
Write-Host "Step 1: Checking backend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5100/api/orders" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Backend is running OK" -ForegroundColor Green
} catch {
    Write-Host "Starting backend..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WindowStyle Minimized
    Write-Host "Waiting 15 seconds for startup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "Step 2: Creating test orders..." -ForegroundColor Yellow

$testOrder1 = @{
    drawingNumber = "TEST-001"
    quantity = 10
    deadline = "2025-08-15T00:00:00.000Z"
    priority = 2
    workType = "Test Work"
    operations = @()
}

$testOrder2 = @{
    drawingNumber = "TEST-002"
    quantity = 5
    deadline = "2025-08-20T00:00:00.000Z"
    priority = 1
    workType = "Test Work"
    operations = @()
}

try {
    $json1 = $testOrder1 | ConvertTo-Json -Depth 3
    Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method POST -Body $json1 -ContentType "application/json" | Out-Null
    Write-Host "Created TEST-001" -ForegroundColor Green
} catch {
    Write-Host "Order 1 creation failed" -ForegroundColor Red
}

try {
    $json2 = $testOrder2 | ConvertTo-Json -Depth 3
    Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method POST -Body $json2 -ContentType "application/json" | Out-Null
    Write-Host "Created TEST-002" -ForegroundColor Green
} catch {
    Write-Host "Order 2 creation failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Checking database..." -ForegroundColor Yellow

try {
    $ordersCheck = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET -ContentType "application/json"
    Write-Host "Total orders in database: $($ordersCheck.total)" -ForegroundColor Cyan
    if ($ordersCheck.data.Count -gt 0) {
        Write-Host "First order: $($ordersCheck.data[0].drawingNumber)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Database check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Checking frontend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\frontend"

try {
    Invoke-WebRequest -Uri "http://localhost:5101" -Method GET -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Host "Frontend is running OK" -ForegroundColor Green
} catch {
    Write-Host "Starting frontend..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized
}

Write-Host ""
Write-Host "RESULTS:" -ForegroundColor Green
Write-Host "=========" -ForegroundColor Green
Write-Host "Open in browser: http://localhost:5101/database" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5100/api/orders" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"
