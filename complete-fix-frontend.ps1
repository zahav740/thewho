# PowerShell script для полного исправления frontend
Write-Host "Complete frontend fix..." -ForegroundColor Green
Set-Location frontend

# Удаляем всё
Write-Host "Cleaning everything..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# Очищаем npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Устанавливаем заново
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install --legacy-peer-deps

Write-Host "Starting frontend..." -ForegroundColor Green
npm start
