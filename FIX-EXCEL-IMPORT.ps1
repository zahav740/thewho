# PowerShell script to fix Excel import for production files
Write-Host "EXCEL IMPORT DIAGNOSIS AND FIX" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

Write-Host ""
Write-Host "Current Issue: Date format errors in Excel import" -ForegroundColor Yellow
Write-Host "File: 2025 june.xlsx" -ForegroundColor Yellow
Write-Host "Sheet: תוכנית יצור (Hebrew production plan)" -ForegroundColor Yellow

Write-Host ""
Write-Host "Step 1: Current database status..." -ForegroundColor Cyan

try {
    $orders = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET
    Write-Host "✅ Database has $($orders.total) orders" -ForegroundColor Green
    
    if ($orders.data.Count -gt 0) {
        Write-Host "📋 Current orders:" -ForegroundColor Cyan
        foreach ($order in $orders.data) {
            Write-Host "  • $($order.drawingNumber) - $($order.quantity) pcs - Priority: $($order.priority)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Database connection error" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Testing import endpoints..." -ForegroundColor Cyan

$endpoints = @(
    "http://localhost:5100/api/orders/import-production-plan",
    "http://localhost:5100/api/orders/flexible-import", 
    "http://localhost:5100/api/orders/upload-excel",
    "http://localhost:5100/api/excel-import-duplicates/analyze"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ Available: $endpoint" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 405) {
            Write-Host "✅ POST only: $endpoint" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Not available: $endpoint" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Step 3: Solutions for your production Excel file:" -ForegroundColor Green

Write-Host ""
Write-Host "SOLUTION 1: Convert to CSV (RECOMMENDED)" -ForegroundColor Yellow
Write-Host "  1. Open your Excel file in Excel/LibreOffice" -ForegroundColor White
Write-Host "  2. Select the sheet 'תוכנית יצור'" -ForegroundColor White
Write-Host "  3. File -> Save As -> CSV (UTF-8)" -ForegroundColor White
Write-Host "  4. Use CSV import in the web interface" -ForegroundColor White

Write-Host ""
Write-Host "SOLUTION 2: Use Production Plan Import" -ForegroundColor Yellow
Write-Host "  1. Go to: http://localhost:5101/database" -ForegroundColor White
Write-Host "  2. Try the Production Plan import button" -ForegroundColor White
Write-Host "  3. This handles Hebrew production files better" -ForegroundColor White

Write-Host ""
Write-Host "SOLUTION 3: Manual Column Mapping" -ForegroundColor Yellow
Write-Host "  1. Use Flexible Import with column mapping" -ForegroundColor White
Write-Host "  2. Map each column manually to avoid date issues" -ForegroundColor White
Write-Host "  3. Skip problematic date columns if needed" -ForegroundColor White

Write-Host ""
Write-Host "Quick test: Creating production-like order..." -ForegroundColor Cyan

$productionOrder = @{
    drawingNumber = "PROD-$(Get-Date -Format 'MMdd')"
    quantity = 15
    deadline = "2025-08-30T00:00:00.000Z"
    priority = 1
    workType = "Production Item"
    operations = @()
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method POST -Body $productionOrder -ContentType "application/json" | Out-Null
    Write-Host "✅ Production test order created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create test order: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "==========" -ForegroundColor Green
Write-Host "1. Try converting your Excel to CSV format first" -ForegroundColor Cyan
Write-Host "2. Open: http://localhost:5101/database" -ForegroundColor Cyan
Write-Host "3. Use CSV import instead of Excel import" -ForegroundColor Cyan
Write-Host "4. If CSV works, we can then fix the Excel import" -ForegroundColor Cyan

Write-Host ""
Read-Host "Press Enter to open the database page"
Start-Process "http://localhost:5101/database"
