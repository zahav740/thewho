# Find PostgreSQL and create fresh DB - Fixed version
Write-Host "=== Fixed DB creation script ===" -ForegroundColor Green

# Stop processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Find PostgreSQL installation
Write-Host "Finding PostgreSQL..." -ForegroundColor Yellow
$pgPaths = @(
    "C:\Program Files\PostgreSQL\*\bin",
    "C:\Program Files (x86)\PostgreSQL\*\bin",
    "C:\PostgreSQL\*\bin",
    "${env:ProgramFiles}\PostgreSQL\*\bin",
    "${env:ProgramFiles(x86)}\PostgreSQL\*\bin"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $psqlExe = Join-Path $resolved.Path "psql.exe"
        if (Test-Path $psqlExe) {
            $psqlPath = $resolved.Path
            break
        }
    }
}

if (-not $psqlPath) {
    Write-Host "PostgreSQL not found in standard locations!" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed" -ForegroundColor Yellow
    
    # Try to start PostgreSQL service anyway
    try {
        $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
        if ($pgService -and $pgService.Status -ne "Running") {
            Start-Service $pgService.Name
            Write-Host "PostgreSQL service started" -ForegroundColor Green
        }
    } catch {
        Write-Host "Could not start PostgreSQL service" -ForegroundColor Red
        return
    }
} else {
    Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green
    $env:PATH = "$psqlPath;$env:PATH"
}

# Set PostgreSQL password
$env:PGPASSWORD = "magarel"

# Create database using direct connection
Write-Host "Creating database thewho..." -ForegroundColor Yellow
try {
    # Try with full path if found
    if ($psqlPath) {
        $psqlCmd = Join-Path $psqlPath "psql.exe"
        $createdbCmd = Join-Path $psqlPath "createdb.exe"
        
        # Drop existing databases
        & $psqlCmd -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS the_who;" 2>$null
        & $psqlCmd -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS thewho;" 2>$null
        
        # Create new database
        & $createdbCmd -h localhost -p 5432 -U postgres thewho 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database thewho created successfully" -ForegroundColor Green
        } else {
            Write-Host "Error creating database" -ForegroundColor Red
            return
        }
    } else {
        Write-Host "Cannot create database - psql not found" -ForegroundColor Red
        return
    }
} catch {
    Write-Host "Database creation error: $($_)" -ForegroundColor Red
    return
}

# Update .env file
Write-Host "Updating .env..." -ForegroundColor Yellow
@"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=magarel
DB_NAME=thewho
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
"@ | Out-File -FilePath ".\backend\.env" -Encoding UTF8

# Clean old migrations to avoid conflicts
Write-Host "Cleaning old migrations..." -ForegroundColor Yellow
$migrationsPath = ".\backend\src\database\migrations"
if (Test-Path $migrationsPath) {
    Get-ChildItem -Path $migrationsPath -Name "*.ts" | ForEach-Object {
        Write-Host "Removing old migration: $_" -ForegroundColor Yellow
        Remove-Item -Path (Join-Path $migrationsPath $_) -Force -ErrorAction SilentlyContinue
    }
}

# Create single clean migration
Write-Host "Creating clean migration..." -ForegroundColor Yellow
$migrationContent = @'
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716825000000 implements MigrationInterface {
    name = 'InitialSchema1716825000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Creating initial schema...');

        // Create machines table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "machines" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "type" character varying NOT NULL,
                "axes" integer NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "isOccupied" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_machines_code" UNIQUE ("code"),
                CONSTRAINT "PK_machines" PRIMARY KEY ("id")
            )
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "orders" (
                "id" SERIAL NOT NULL,
                "drawing_number" character varying UNIQUE,
                "quantity" integer NOT NULL,
                "deadline" date NOT NULL,
                "priority" integer NOT NULL,
                "workType" character varying,
                "pdfPath" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_orders" PRIMARY KEY ("id")
            )
        `);

        // Create operations table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "operations" (
                "id" SERIAL NOT NULL,
                "operationNumber" integer NOT NULL,
                "estimatedTime" integer NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "orderId" integer,
                "machineId" integer,
                CONSTRAINT "PK_operations" PRIMARY KEY ("id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "operations" 
            ADD CONSTRAINT "FK_operations_order" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "operations" 
            ADD CONSTRAINT "FK_operations_machine" 
            FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL
        `);

        // Add test data
        await queryRunner.query(`
            INSERT INTO "machines" ("code", "type", "axes", "isActive", "isOccupied") VALUES
            ('M001', 'MILLING', 3, true, false),
            ('M002', 'MILLING', 4, true, false),
            ('T001', 'TURNING', 3, true, false),
            ('T002', 'TURNING', 4, true, false)
        `);

        await queryRunner.query(`
            INSERT INTO "orders" ("drawing_number", "quantity", "deadline", "priority", "workType") VALUES
            ('DWG-001', 10, '2025-06-15', 1, 'Milling operation'),
            ('DWG-002', 5, '2025-06-20', 2, 'Turning operation'),
            ('DWG-003', 15, '2025-07-01', 3, 'Complex machining')
        `);

        await queryRunner.query(`
            INSERT INTO "operations" ("operationNumber", "estimatedTime", "status", "orderId", "machineId") VALUES
            (10, 120, 'PENDING', 1, 1),
            (20, 90, 'PENDING', 1, 2),
            (10, 180, 'PENDING', 2, 3),
            (10, 240, 'PENDING', 3, 1)
        `);

        console.log('Initial schema created successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "operations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "machines"`);
    }
}
'@

$migrationFile = Join-Path $migrationsPath "1716825000000-InitialSchema.ts"
New-Item -ItemType Directory -Path $migrationsPath -Force | Out-Null
$migrationContent | Out-File -FilePath $migrationFile -Encoding UTF8
Write-Host "Clean migration created" -ForegroundColor Green

# Go to backend and build
Write-Host "Building backend..." -ForegroundColor Yellow
cd backend

try {
    npm run build 2>build_errors.log
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed - check build_errors.log" -ForegroundColor Red
        Get-Content build_errors.log | Select-Object -Last 5
        cd ..
        return
    }
    Write-Host "Backend built successfully" -ForegroundColor Green
} catch {
    Write-Host "Build error: $($_)" -ForegroundColor Red
    cd ..
    return
}

# Run migration
Write-Host "Running migration..." -ForegroundColor Yellow
try {
    npm run migration:run 2>migration_errors.log
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration failed - check migration_errors.log" -ForegroundColor Red
        Get-Content migration_errors.log | Select-Object -Last 5
        cd ..
        return
    }
    Write-Host "Migration completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Migration error: $($_)" -ForegroundColor Red
    cd ..
    return
}

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized

cd ..

# Wait and check backend
Write-Host "Waiting for backend (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

$backendOK = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend health check: OK" -ForegroundColor Green
        $backendOK = $true
    } else {
        Write-Host "Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Backend not responding: $($_)" -ForegroundColor Red
}

if ($backendOK) {
    # Test API endpoints
    Write-Host "Testing API endpoints..." -ForegroundColor Yellow
    
    try {
        $machines = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $orders = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        Write-Host "Machines API: $(if($machines.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($machines.StatusCode -eq 200){'Green'}else{'Red'})
        Write-Host "Orders API: $(if($orders.StatusCode -eq 200){'OK'}else{'ERROR'})" -ForegroundColor $(if($orders.StatusCode -eq 200){'Green'}else{'Red'})
        
        if ($machines.StatusCode -eq 200 -and $orders.StatusCode -eq 200) {
            Write-Host "`nBACKEND IS WORKING!" -ForegroundColor Green
            
            # Start frontend
            Write-Host "Starting frontend..." -ForegroundColor Yellow
            cd frontend
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WindowStyle Minimized
            cd ..
            
            Write-Host "Waiting for frontend..." -ForegroundColor Yellow
            Start-Sleep -Seconds 25
            
            try {
                $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($frontend.StatusCode -eq 200) {
                    Write-Host "FRONTEND IS WORKING!" -ForegroundColor Green
                    Write-Host "`nEVERYTHING IS READY!" -ForegroundColor Green
                    Write-Host "Opening browser..." -ForegroundColor Cyan
                    Start-Process "http://localhost:3001"
                } else {
                    Write-Host "Frontend has issues" -ForegroundColor Red
                }
            } catch {
                Write-Host "Frontend error: $($_)" -ForegroundColor Red
            }
        } else {
            Write-Host "API endpoints have issues" -ForegroundColor Red
        }
    } catch {
        Write-Host "API test error: $($_)" -ForegroundColor Red
    }
} else {
    Write-Host "Backend failed to start properly" -ForegroundColor Red
}

Write-Host "`nScript completed!" -ForegroundColor Green
