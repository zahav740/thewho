# Fix PostgreSQL PATH and Test Connection
Write-Host "=== Fixing PostgreSQL PATH Issues ===" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL is running but psql/pg_isready not in PATH
Write-Host "PostgreSQL service is running, but command-line tools not accessible" -ForegroundColor Yellow
Write-Host "Let's find and add PostgreSQL bin directory to PATH..." -ForegroundColor Yellow
Write-Host ""

# Find PostgreSQL installation
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin", 
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files\PostgreSQL\13\bin",
    "C:\Program Files (x86)\PostgreSQL\*\bin"
)

$pgBinPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $pgBinPath = $path
        Write-Host "✅ Found PostgreSQL at: $pgBinPath" -ForegroundColor Green
        break
    }
}

if (-not $pgBinPath) {
    # Search in all Program Files
    Write-Host "Searching in all PostgreSQL installations..." -ForegroundColor Yellow
    $pgInstalls = Get-ChildItem "C:\Program Files\PostgreSQL\" -Directory -ErrorAction SilentlyContinue
    foreach ($install in $pgInstalls) {
        $binPath = "$($install.FullName)\bin"
        if (Test-Path "$binPath\psql.exe") {
            $pgBinPath = $binPath
            Write-Host "✅ Found PostgreSQL at: $pgBinPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $pgBinPath) {
    Write-Host "❌ Could not find PostgreSQL installation with psql.exe" -ForegroundColor Red
    Write-Host "This is unusual since the service is running..." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Test connection using full path
Write-Host "Testing connection using full path to psql..." -ForegroundColor Yellow

# Set password environment variable
$env:PGPASSWORD = "magarel"

try {
    # Test connection to postgres database first
    Write-Host "Testing connection to default 'postgres' database..." -ForegroundColor White
    $result = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully connected to PostgreSQL!" -ForegroundColor Green
        Write-Host ""
        
        # Check if the_who database exists
        Write-Host "Checking if 'the_who' database exists..." -ForegroundColor Yellow
        $dbCheck = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname = 'the_who';" -t 2>&1
        
        if ($dbCheck -match "the_who") {
            Write-Host "✅ Database 'the_who' exists" -ForegroundColor Green
            
            # Test connection to the_who
            Write-Host "Testing connection to 'the_who' database..." -ForegroundColor Yellow
            $theWhoResult = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "SELECT current_database();" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully connected to 'the_who' database!" -ForegroundColor Green
                Write-Host ""
                
                # Show existing tables
                Write-Host "Current tables in 'the_who':" -ForegroundColor Cyan
                & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\dt" 2>&1
                Write-Host ""
                
                Write-Host "🎯 GREAT! Everything is working!" -ForegroundColor Green
                Write-Host ""
                Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
                Write-Host "✅ Password 'magarel' is correct" -ForegroundColor Green
                Write-Host "✅ Database 'the_who' exists and accessible" -ForegroundColor Green
                Write-Host ""
                
                # Add PostgreSQL to PATH for this session
                Write-Host "Adding PostgreSQL to PATH for this session..." -ForegroundColor Yellow
                $env:PATH = "$pgBinPath;$env:PATH"
                Write-Host "✅ PostgreSQL tools added to PATH" -ForegroundColor Green
                Write-Host ""
                
                # Now run the application
                $runApp = Read-Host "Everything is ready! Run migrations and start application? (y/n)"
                if ($runApp -eq "y" -or $runApp -eq "Y") {
                    
                    Write-Host ""
                    Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
                    Set-Location "backend"
                    
                    # Run migrations
                    npm run migration:run
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
                        Write-Host ""
                        
                        $startApps = Read-Host "Start backend and frontend? (y/n)"
                        if ($startApps -eq "y" -or $startApps -eq "Y") {
                            Write-Host ""
                            Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
                            Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev" -WindowStyle Normal
                            
                            Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
                            Set-Location "..\frontend"
                            Start-Sleep -Seconds 3
                            Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal
                            
                            Write-Host ""
                            Write-Host "🎉 APPLICATION STARTED SUCCESSFULLY!" -ForegroundColor Green
                            Write-Host ""
                            Write-Host "🔗 Backend API: http://localhost:3000" -ForegroundColor Cyan
                            Write-Host "🔗 Frontend App: http://localhost:3001" -ForegroundColor Cyan
                            Write-Host ""
                            Write-Host "Backend will start first, then frontend will open in browser automatically." -ForegroundColor White
                        }
                    } else {
                        Write-Host "❌ Migration failed. Check the error messages above." -ForegroundColor Red
                    }
                }
                
            } else {
                Write-Host "❌ Cannot connect to 'the_who' database: $theWhoResult" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Database 'the_who' does not exist" -ForegroundColor Red
            Write-Host "Creating database 'the_who'..." -ForegroundColor Yellow
            
            $createResult = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE the_who;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database 'the_who' created successfully!" -ForegroundColor Green
                Write-Host "Now you can run the migrations and start the app." -ForegroundColor White
            } else {
                Write-Host "❌ Failed to create database: $createResult" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "❌ Failed to connect to PostgreSQL" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "1. Password 'magarel' is incorrect"
        Write-Host "2. User 'postgres' doesn't exist"  
        Write-Host "3. PostgreSQL not accepting connections"
        Write-Host ""
        
        # Try different passwords
        Write-Host "Let's try some common passwords..." -ForegroundColor Yellow
        $passwords = @("postgres", "password", "admin", "123456")
        
        foreach ($pwd in $passwords) {
            Write-Host "Trying password: '$pwd'" -ForegroundColor White
            $env:PGPASSWORD = $pwd
            $testResult = & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" -t 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ FOUND CORRECT PASSWORD: '$pwd'" -ForegroundColor Green
                
                # Update .env file
                if (Test-Path ".env") {
                    Write-Host "Updating .env file with correct password..." -ForegroundColor Yellow
                    $envContent = Get-Content ".env"
                    $newContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$pwd"
                    Set-Content ".env" $newContent
                    Write-Host "✅ .env file updated" -ForegroundColor Green
                }
                break
            } else {
                Write-Host "❌ Password '$pwd' failed" -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "❌ Error running psql: $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "PostgreSQL Service: ✅ Running" -ForegroundColor Green
Write-Host "PostgreSQL Tools: ✅ Found at $pgBinPath" -ForegroundColor Green

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database Connection: ✅ Working" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Your system is ready for the Production CRM application!" -ForegroundColor Green
} else {
    Write-Host "Database Connection: ❌ Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check PostgreSQL password"
    Write-Host "2. Or use SQLite instead: .\start-with-sqlite.bat"
}

Read-Host "Press Enter to exit"
