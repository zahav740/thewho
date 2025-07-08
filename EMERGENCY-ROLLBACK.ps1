# Quick rollback of TypeScript changes
Write-Host "EMERGENCY ROLLBACK - RESTORE WORKING STATE" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor Red

Write-Host ""
Write-Host "Rolling back TypeScript logger changes..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend\src\modules\orders"

$files = @(
    "excel-simple.controller.ts",
    "excel-test.controller.ts", 
    "excel-upload-test.controller.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Restoring $file..." -ForegroundColor Cyan
        
        # Backup current version
        Copy-Item $file "$file.backup" -Force
        
        # Restore original logger usage
        $content = Get-Content $file -Raw
        $content = $content -replace 'const logger = new Logger\([^)]+\);\s*', ''
        $content = $content -replace 'logger\.log', 'this.logger.log'
        $content = $content -replace 'logger\.error', 'this.logger.error'
        
        Set-Content $file $content
        Write-Host "✅ Restored $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Restarting backend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend"

# Stop existing backend processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start backend
Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WindowStyle Minimized

Write-Host "Waiting for backend to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5100/api/orders" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is responding after rollback" -ForegroundColor Green
    
    # Test orders count
    $orders = Invoke-RestMethod -Uri "http://localhost:5100/api/orders" -Method GET
    Write-Host "✅ Database has $($orders.total) orders" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "ROLLBACK SUCCESSFUL!" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    Write-Host "Try your Excel import again at: http://localhost:5101/database" -ForegroundColor Cyan
    Write-Host "The original functionality should now be restored" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Backend still not responding. Manual restart may be needed." -ForegroundColor Red
    Write-Host "Try: npm run start:dev" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to open database page"
Start-Process "http://localhost:5101/database"
