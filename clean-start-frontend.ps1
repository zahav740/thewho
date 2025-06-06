# PowerShell script для очистки и запуска frontend
Write-Host "Cleaning and reinstalling frontend dependencies..." -ForegroundColor Green
Set-Location frontend

# Удаляем node_modules если существует
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

# Удаляем package-lock.json если существует
if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
}

Write-Host "Installing dependencies with legacy peer deps..." -ForegroundColor Green
npm install --legacy-peer-deps

Write-Host "Starting frontend..." -ForegroundColor Green
npm start
