# Quick Start - Skip Migrations and Run with Existing Tables
Write-Host "=== Quick Start - Using Existing Tables ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your database already has these tables:" -ForegroundColor Green
Write-Host "✅ migrations" -ForegroundColor White
Write-Host "✅ operations" -ForegroundColor White  
Write-Host "✅ orders" -ForegroundColor White
Write-Host "✅ planning_results" -ForegroundColor White
Write-Host "✅ setups" -ForegroundColor White
Write-Host "✅ shifts" -ForegroundColor White
Write-Host ""

Write-Host "This might be enough to run the application!" -ForegroundColor Yellow
Write-Host "Let's start the backend and frontend without running migrations..." -ForegroundColor Yellow
Write-Host ""

# Add PostgreSQL to PATH for this session
$env:PATH = "C:\Program Files\PostgreSQL\17\bin;$env:PATH"
Write-Host "✅ PostgreSQL tools added to PATH" -ForegroundColor Green

Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
Set-Location "backend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "title Backend && npm run start:dev" -WindowStyle Normal

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "title Frontend && npm start" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 APPLICATION STARTED!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Frontend App: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "- Backend will start first (check the Backend window)" -ForegroundColor White
Write-Host "- Frontend will open in browser automatically" -ForegroundColor White
Write-Host "- If you see errors, they might be due to missing table columns" -ForegroundColor White
Write-Host "- But the main functionality should work!" -ForegroundColor White
Write-Host ""

$checkApi = Read-Host "Test the backend API now? (y/n)"
if ($checkApi -eq "y" -or $checkApi -eq "Y") {
    Write-Host ""
    Write-Host "Testing backend endpoints..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    try {
        Write-Host "Testing /api/machines..." -ForegroundColor White
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ /api/machines - Working!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ /api/machines - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        Write-Host "Testing /api/orders..." -ForegroundColor White  
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ /api/orders - Working!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ /api/orders - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 If you see any errors in the backend window," -ForegroundColor Yellow
Write-Host "   run the migration fix script: .\fix-migration-types.ps1" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to finish"
