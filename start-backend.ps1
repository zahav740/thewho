# PowerShell script для запуска backend
Write-Host "Starting Production CRM Backend..." -ForegroundColor Green
Set-Location backend
npm install
npm run start:dev
