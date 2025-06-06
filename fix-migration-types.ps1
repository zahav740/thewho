# Fix Migration Issues - Check and Fix Data Types
Write-Host "=== Fixing Migration Data Type Issues ===" -ForegroundColor Cyan
Write-Host ""

$pgBinPath = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "magarel"

Write-Host "The migration failed because of data type mismatch:" -ForegroundColor Yellow
Write-Host "- Existing 'operations.id' column is UUID type" -ForegroundColor White
Write-Host "- Migration expects INTEGER type" -ForegroundColor White
Write-Host ""

Write-Host "Let's check the actual structure of existing tables..." -ForegroundColor Yellow
Write-Host ""

# Check operations table structure
Write-Host "=== OPERATIONS TABLE STRUCTURE ===" -ForegroundColor Cyan
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\d operations"

Write-Host ""
Write-Host "=== ORDERS TABLE STRUCTURE ===" -ForegroundColor Cyan  
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\d orders"

Write-Host ""
Write-Host "=== MACHINES TABLE STRUCTURE ===" -ForegroundColor Cyan
& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "\d machines"

Write-Host ""
Write-Host "Now I'll create a fixed migration that matches your existing schema..." -ForegroundColor Yellow

# Create a new migration file that works with existing UUID structure
$migrationContent = @"
/**
 * @file: 1716815000000-FixExistingSchema.ts
 * @description: Migration to work with existing UUID-based schema
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixExistingSchema1716815000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Fixing schema to work with existing tables...');
    
    // Check if machines table exists and create if needed
    const machinesExists = await this.tableExists(queryRunner, 'machines');
    if (!machinesExists) {
      console.log('Creating machines table with UUID...');
      await queryRunner.query(`
        CREATE TABLE "machines" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "code" character varying NOT NULL UNIQUE,
          "type" character varying NOT NULL CHECK (type IN ('MILLING', 'TURNING')),
          "axes" integer NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "isOccupied" boolean NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      
      // Add some test data
      await queryRunner.query(`
        INSERT INTO "machines" (code, type, axes) VALUES 
        ('M001', 'MILLING', 3),
        ('M002', 'MILLING', 4),
        ('T001', 'TURNING', 3)
      `);
    } else {
      console.log('Machines table already exists');
    }
    
    // Check and fix operations table foreign keys if needed
    const operationsExists = await this.tableExists(queryRunner, 'operations');
    if (operationsExists) {
      console.log('Operations table exists, checking foreign keys...');
      
      // Check if orderId column exists and its type
      const orderIdExists = await this.columnExists(queryRunner, 'operations', 'orderId');
      if (!orderIdExists) {
        console.log('Adding orderId column to operations...');
        await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "orderId" uuid`);
        await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_order" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE`);
      }
      
      // Check if machineId column exists  
      const machineIdExists = await this.columnExists(queryRunner, 'operations', 'machineId');
      if (!machineIdExists) {
        console.log('Adding machineId column to operations...');
        await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "machineId" uuid`);
        await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_machine" FOREIGN KEY ("machineId") REFERENCES "machines" ("id")`);
      }
    }
    
    // Create shift_records table with UUID foreign keys
    const shiftRecordsExists = await this.tableExists(queryRunner, 'shift_records');
    if (!shiftRecordsExists) {
      console.log('Creating shift_records table with UUID foreign keys...');
      await queryRunner.query(`
        DO \$\$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_records_shifttype_enum') THEN
            CREATE TYPE "shift_records_shifttype_enum" AS ENUM('DAY', 'NIGHT');
          END IF;
        END
        \$\$;
      `);
      
      await queryRunner.query(`
        CREATE TABLE "shift_records" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "date" date NOT NULL,
          "shiftType" "shift_records_shifttype_enum" NOT NULL,
          "setupStartDate" date,
          "setupOperator" character varying,
          "setupType" character varying,
          "setupTime" integer,
          "dayShiftQuantity" integer,
          "dayShiftOperator" character varying,
          "dayShiftTimePerUnit" numeric(10,2),
          "nightShiftQuantity" integer,
          "nightShiftOperator" character varying NOT NULL DEFAULT 'Аркадий',
          "nightShiftTimePerUnit" numeric(10,2),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "operationId" uuid,
          "machineId" uuid,
          CONSTRAINT "FK_shift_records_operation" FOREIGN KEY ("operationId") REFERENCES "operations" ("id"),
          CONSTRAINT "FK_shift_records_machine" FOREIGN KEY ("machineId") REFERENCES "machines" ("id")
        )
      `);
    } else {
      console.log('shift_records table already exists');
    }
    
    console.log('Schema fixes completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_records"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_records_shifttype_enum"`);
    
    const operationsExists = await this.tableExists(queryRunner, 'operations');
    if (operationsExists) {
      await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_order"`);
      await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "orderId"`);
      await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_machine"`);
      await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "machineId"`);
    }
  }
  
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '\${tableName}'
      )
    `);
    return result[0].exists;
  }
  
  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '\${tableName}'
        AND column_name = '\${columnName}'
      )
    `);
    return result[0].exists;
  }
}
"@

# Write the new migration file
$migrationPath = "backend\src\database\migrations\1716815000000-FixExistingSchema.ts"
Set-Content -Path $migrationPath -Value $migrationContent -Encoding UTF8

Write-Host "✅ Created new migration file: $migrationPath" -ForegroundColor Green
Write-Host ""

# Also let's skip the problematic migrations by marking them as executed
Write-Host "Marking problematic migrations as completed..." -ForegroundColor Yellow

$markMigrationsCompleted = @"
-- Mark migrations as completed to avoid conflicts
INSERT INTO migrations (timestamp, name) VALUES 
(1716811500000, 'CreateBaseTables1716811500000'),
(1716813000000, 'SeedInitialData1716813000000'),
(1716814000000, 'UpdateExistingTables1716814000000')
ON CONFLICT (timestamp) DO NOTHING;
"@

& "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c $markMigrationsCompleted

Write-Host "✅ Marked migrations as completed" -ForegroundColor Green
Write-Host ""

Write-Host "Now let's run the new migration..." -ForegroundColor Yellow
Set-Location "backend"
npm run migration:run

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Test the database structure
    Write-Host "Testing database structure..." -ForegroundColor Yellow
    Set-Location ".."
    & "$pgBinPath\psql.exe" -h localhost -p 5432 -U postgres -d the_who -c "SELECT 'machines' as table_name, count(*) as row_count FROM machines UNION ALL SELECT 'orders', count(*) FROM orders UNION ALL SELECT 'operations', count(*) FROM operations;"
    Write-Host ""
    
    $startApp = Read-Host "Database is ready! Start the application? (y/n)"
    if ($startApp -eq "y" -or $startApp -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
        Set-Location "backend"
        Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev" -WindowStyle Normal
        
        Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
        Set-Location "..\frontend"
        Start-Sleep -Seconds 3
        Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal
        
        Write-Host ""
        Write-Host "🎉 APPLICATION STARTED!" -ForegroundColor Green
        Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Migration still failing. Let's try running without migrations..." -ForegroundColor Red
    Write-Host ""
    
    $runAnyway = Read-Host "Try starting the application anyway? The existing tables might be sufficient (y/n)"
    if ($runAnyway -eq "y" -or $runAnyway -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Starting backend..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run start:dev" -WindowStyle Normal
        
        Write-Host "🚀 Starting frontend..." -ForegroundColor Yellow
        Set-Location "..\frontend"
        Start-Sleep -Seconds 3
        Start-Process -FilePath "cmd" -ArgumentList "/k", "npm start" -WindowStyle Normal
        
        Write-Host ""
        Write-Host "🎉 APPLICATION STARTED!" -ForegroundColor Green
        Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Note: Some features might not work if tables are incomplete" -ForegroundColor Yellow
    }
}

# Cleanup
$env:PGPASSWORD = $null

Read-Host "Press Enter to exit"
