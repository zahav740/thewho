# EMERGENCY FIX - Remove double "this" errors
Write-Host "FIXING DOUBLE THIS ERRORS" -ForegroundColor Red
Write-Host "=========================" -ForegroundColor Red

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend\src\modules\orders"

$files = @(
    "excel-simple.controller.ts",
    "excel-test.controller.ts", 
    "excel-upload-test.controller.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Fix double this issue
        $content = $content -replace 'this\.this\.logger', 'this.logger'
        
        Set-Content $file $content
        Write-Host "✅ Fixed $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Restarting backend..." -ForegroundColor Yellow

Set-Location "C:\Users\Alexey\Downloads\thewho-main\backend"

# Kill backend processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start backend
Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WindowStyle Normal

Write-Host "Backend restarting..." -ForegroundColor Cyan
Write-Host "Wait 15 seconds then test Excel import" -ForegroundColor Cyan

Read-Host "Press Enter when ready to test"
Start-Process "http://localhost:5101/database"
