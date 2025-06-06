# Quick Database Setup and Start
Write-Host "=== Production CRM - Quick Start ===" -ForegroundColor Cyan

# Navigate to backend
Set-Location "C:\Users\Alexey\Downloads\TheWho\production-crm\backend"

Write-Host "Running migrations..." -ForegroundColor Yellow
npm run migration:run

Write-Host "Starting backend..." -ForegroundColor Yellow  
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev"

Write-Host "Starting frontend..." -ForegroundColor Yellow
Set-Location "..\frontend"
Start-Sleep -Seconds 2
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start"

Write-Host ""
Write-Host "Application started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
