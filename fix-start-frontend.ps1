# PowerShell script для исправления и запуска frontend
Write-Host "Fixing frontend dependencies..." -ForegroundColor Green
Set-Location frontend

Write-Host "Adding missing ajv dependency..." -ForegroundColor Yellow
npm install ajv@^8.12.0 --save-dev --legacy-peer-deps

Write-Host "Starting frontend..." -ForegroundColor Green
npm start
