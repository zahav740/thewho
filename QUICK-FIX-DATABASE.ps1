# QUICK DATABASE FIX SCRIPT
Write-Host "🚀 QUICK DATABASE FIX" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 1. Checking backend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend"

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5100/api/orders" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running on port 5100" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding, starting..." -ForegroundColor Red
    Write-Host "🔧 Installing dependencies..." -ForegroundColor Yellow
    npm install --silent
    
    Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized
    
    Write-Host "⏳ Waiting 15 seconds for startup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "📋 2. Checking API and database..." -ForegroundColor Yellow

try {
    $ordersResponse = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET -ContentType "application/json"
    $totalOrders = $ordersResponse.total

    Write-Host "✅ API responding" -ForegroundColor Green
    Write-Host "📊 Orders in database: $totalOrders" -ForegroundColor Cyan

    if ($totalOrders -eq 0) {
        Write-Host "❌ Database is empty - creating test orders..." -ForegroundColor Red
        
        $testOrders = @(
            @{
                drawingNumber = "TEST-001"
                quantity = 10
                deadline = "2025-08-15T00:00:00.000Z"
                priority = 2
                workType = "Milling"
                operations = @()
            },
            @{
                drawingNumber = "TEST-002"
                quantity = 5
                deadline = "2025-08-20T00:00:00.000Z"
                priority = 1
                workType = "Turning"
                operations = @()
            },
            @{
                drawingNumber = "TEST-003"
                quantity = 8
                deadline = "2025-08-25T00:00:00.000Z"
                priority = 3
                workType = "Assembly"
                operations = @()
            }
        )

        foreach ($order in $testOrders) {
            try {
                $json = $order | ConvertTo-Json -Depth 3
                Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method POST -Body $json -ContentType "application/json" | Out-Null
                Write-Host "✅ Created order: $($order.drawingNumber)" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to create order: $($order.drawingNumber)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✅ Database has orders" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 3. Checking frontend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\frontend"

try {
    Invoke-WebRequest -Uri "http://localhost:5101" -Method GET -TimeoutSec 5 -ErrorAction Stop | Out-Null
    Write-Host "✅ Frontend running on port 5101" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend not running" -ForegroundColor Red
    Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm start" -WindowStyle Minimized
}

Write-Host ""
Write-Host "📋 FINAL CHECK:" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Start-Sleep -Seconds 3

try {
    $finalCheck = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET -ContentType "application/json"
    Write-Host "✅ SUCCESS! Backend working" -ForegroundColor Green
    Write-Host "📊 Total orders: $($finalCheck.total)" -ForegroundColor Cyan
    Write-Host "📋 Data on page: $($finalCheck.data.Count)" -ForegroundColor Cyan
    
    if ($finalCheck.data.Count -gt 0) {
        Write-Host "📝 First order: $($finalCheck.data[0].drawingNumber)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ API still not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Open: http://localhost:5101/database" -ForegroundColor Cyan
Write-Host "📋 Backend API: http://localhost:5100/api/orders" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ DONE! If database still empty:" -ForegroundColor Green
Write-Host "   1. Go to Database section" -ForegroundColor White
Write-Host "   2. Click 'Create Order'" -ForegroundColor White
Write-Host "   3. Or use CSV/Excel import" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
