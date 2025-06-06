# PowerShell script для запуска frontend
Write-Host "Starting Production CRM Frontend..." -ForegroundColor Green
Set-Location frontend
npm install
npm start
