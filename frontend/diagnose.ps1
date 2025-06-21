# Mobile Build Diagnostics
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MOBILE BUILD DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Host "Start time: $startTime" -ForegroundColor Gray
Write-Host ""

# Check 1: Basic files
Write-Host "CHECK 1: Project Structure" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

if (Test-Path "package.json") {
    Write-Host "[OK] package.json found" -ForegroundColor Green
    $packageContent = Get-Content "package.json" | Select-String "name|version|scripts" | Select-Object -First 5
    Write-Host "Package info:" -ForegroundColor Gray
    $packageContent | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "[ERROR] package.json NOT FOUND" -ForegroundColor Red
    Write-Host "Make sure you run this from frontend folder" -ForegroundColor Yellow
    exit 1
}

if (Test-Path "src") {
    Write-Host "[OK] src folder found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] src folder NOT FOUND" -ForegroundColor Red
}

if (Test-Path "public") {
    Write-Host "[OK] public folder found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] public folder NOT FOUND" -ForegroundColor Red
}

Write-Host ""

# Check 2: Node.js and npm
Write-Host "CHECK 2: Environment" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

Write-Host "Checking Node.js..." -ForegroundColor Gray
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[OK] Node.js working: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "[ERROR] Node.js NOT FOUND or NOT WORKING" -ForegroundColor Red
    Write-Host "Install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking npm..." -ForegroundColor Gray
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "[OK] npm working: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "[ERROR] npm NOT FOUND or NOT WORKING" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check 3: Dependencies
Write-Host "CHECK 3: Dependencies" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "[OK] node_modules found" -ForegroundColor Green
    $nodeModulesSize = (Get-ChildItem "node_modules" -Recurse -File | Measure-Object).Count
    Write-Host "Files in node_modules: $nodeModulesSize" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] node_modules NOT FOUND" -ForegroundColor Red
    Write-Host "You need to run: npm install" -ForegroundColor Yellow
}

if (Test-Path "package-lock.json") {
    Write-Host "[OK] package-lock.json found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] package-lock.json not found (may be normal)" -ForegroundColor Yellow
}

Write-Host ""

# Check 4: TypeScript compilation
Write-Host "CHECK 4: TypeScript" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

Write-Host "Checking TypeScript compilation..." -ForegroundColor Gray
try {
    $tscOutput = npx tsc --noEmit --skipLibCheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] TYPESCRIPT ERRORS FOUND:" -ForegroundColor Red
        Write-Host "----------------------------------------" -ForegroundColor Red
        $tscOutput | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        Write-Host "----------------------------------------" -ForegroundColor Red
        Write-Host ""
        Write-Host "You need to fix TypeScript errors above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Could not run TypeScript check" -ForegroundColor Red
}

Write-Host ""

# Check 5: Test build
Write-Host "CHECK 5: Test Build" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

Write-Host "Attempting test build..." -ForegroundColor Gray
Write-Host "(this may take a few minutes)" -ForegroundColor Gray

# Set environment variables
$env:GENERATE_SOURCEMAP = "false"
$env:CI = "false"

Write-Host "Running npm run build..." -ForegroundColor Gray
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] BUILD SUCCESSFUL!" -ForegroundColor Green
        
        if (Test-Path "build") {
            Write-Host "[OK] build folder created" -ForegroundColor Green
            Write-Host "Build contents:" -ForegroundColor Gray
            Get-ChildItem "build" | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Gray }
        } else {
            Write-Host "[ERROR] build folder not created" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] BUILD FAILED" -ForegroundColor Red
        Write-Host "----------------------------------------" -ForegroundColor Red
        Write-Host "LAST ERROR LINES:" -ForegroundColor Red
        $buildOutput | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        Write-Host "----------------------------------------" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Could not run build" -ForegroundColor Red
}

Write-Host ""

# Check 6: Mobile files
Write-Host "CHECK 6: Mobile Files" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$mobileFiles = @(
    @{Path="src\hooks\useMobile.ts"; Name="useMobile.ts"},
    @{Path="src\components\Mobile\MobileWrapper.tsx"; Name="MobileWrapper.tsx"},
    @{Path="src\styles\mobile.css"; Name="mobile.css"},
    @{Path="mobile-styles.css"; Name="mobile-styles.css"},
    @{Path="mobile-logic.js"; Name="mobile-logic.js"}
)

foreach ($file in $mobileFiles) {
    if (Test-Path $file.Path) {
        Write-Host "[OK] $($file.Name) found" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] $($file.Name) NOT FOUND" -ForegroundColor Red
    }
}

Write-Host ""

# Final report
Write-Host "FINAL REPORT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "Issues that need to be fixed:" -ForegroundColor Yellow
Write-Host ""

$issues = @()
if (!(Test-Path "package.json")) { $issues += "- Run script from frontend folder" }
if (!(Test-Path "node_modules")) { $issues += "- Run: npm install" }

if ($issues.Count -eq 0) {
    Write-Host "No major issues found!" -ForegroundColor Green
} else {
    $issues | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Fix issues above" -ForegroundColor Gray
Write-Host "2. Run diagnostics again" -ForegroundColor Gray
Write-Host "3. If all OK, run main build script" -ForegroundColor Gray

$endTime = Get-Date
Write-Host ""
Write-Host "End time: $endTime" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
