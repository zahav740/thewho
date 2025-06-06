# PostgreSQL Password Test
Write-Host "=== PostgreSQL Password Test ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing different common passwords for PostgreSQL user 'postgres'..." -ForegroundColor Yellow
Write-Host ""

# Common passwords to test
$passwords = @("magarel", "postgres", "password", "admin", "123456", "", "root")

foreach ($password in $passwords) {
    Write-Host "Testing password: '$password'" -ForegroundColor White
    
    # Set password environment variable
    if ($password -eq "") {
        $env:PGPASSWORD = $null
        Write-Host "  (no password)" -ForegroundColor Gray
    } else {
        $env:PGPASSWORD = $password
    }
    
    # Test connection
    try {
        $result = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 'SUCCESS' as result;" -t 2>&1
        if ($LASTEXITCODE -eq 0 -and $result -match "SUCCESS") {
            Write-Host "  ✅ CORRECT PASSWORD: '$password'" -ForegroundColor Green
            
            # Update .env file with correct password
            $envPath = "backend\.env"
            if (Test-Path $envPath) {
                Write-Host "  Updating .env file..." -ForegroundColor Yellow
                $envContent = Get-Content $envPath
                $newContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$password"
                Set-Content $envPath $newContent
                Write-Host "  ✅ .env file updated" -ForegroundColor Green
            }
            break
        } else {
            Write-Host "  ❌ Wrong password" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Connection failed" -ForegroundColor Red
    }
}

# Cleanup
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "If none of the common passwords worked:" -ForegroundColor Yellow
Write-Host "1. Check pgAdmin - it might show the correct password"
Write-Host "2. Reset PostgreSQL password:"
Write-Host "   - Stop PostgreSQL service"
Write-Host "   - Edit pg_hba.conf to allow trust authentication"
Write-Host "   - Restart PostgreSQL"
Write-Host "   - Change password with: ALTER USER postgres PASSWORD 'newpassword';"
Write-Host "3. Or reinstall PostgreSQL"

Read-Host "Press Enter to continue"
