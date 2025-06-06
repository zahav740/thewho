# PowerShell script для полной переустановки frontend
Write-Host "Full reinstall of frontend dependencies..." -ForegroundColor Green
Set-Location frontend

# Удаляем node_modules
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

# Удаляем package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
}

# Очищаем npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "Starting frontend..." -ForegroundColor Green
npm start
