# STEP-BY-STEP DATABASE FIX
# Copy and paste these commands one by one in PowerShell

# Step 1: Go to backend directory and start backend
Write-Host "=== STEP 1: START BACKEND ===" -ForegroundColor Green
Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend"
Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WindowStyle Normal

# Wait and then continue with Step 2
Write-Host "Wait 20 seconds for backend to start, then continue with Step 2..."
Start-Sleep -Seconds 20

Write-Host "=== STEP 2: CHECK API ===" -ForegroundColor Green
try {
    $check = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET
    Write-Host "API working! Orders: $($check.total)" -ForegroundColor Green
} catch {
    Write-Host "API not ready yet, wait more..." -ForegroundColor Red
}

Write-Host "=== STEP 3: CREATE TEST ORDER ===" -ForegroundColor Green
$order = @{
    drawingNumber = "TEST-001"
    quantity = 10
    deadline = "2025-08-15T00:00:00.000Z"
    priority = 2
    workType = "Test Work"
    operations = @()
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method POST -Body $order -ContentType "application/json"
    Write-Host "Test order created!" -ForegroundColor Green
} catch {
    Write-Host "Order creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== STEP 4: FINAL CHECK ===" -ForegroundColor Green
$final = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET
Write-Host "Final count: $($final.total) orders" -ForegroundColor Cyan

Write-Host "=== STEP 5: OPEN BROWSER ===" -ForegroundColor Green
Start-Process "http://localhost:5101/database"

Write-Host "DONE! Check your browser!" -ForegroundColor Green
