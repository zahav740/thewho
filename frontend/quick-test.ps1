# Quick Build Test
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "QUICK BUILD TEST" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test TypeScript
Write-Host "Testing TypeScript..." -ForegroundColor Yellow
try {
    $tscOutput = npx tsc --noEmit --skipLibCheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] TypeScript check passed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] TypeScript errors:" -ForegroundColor Red
        $tscOutput
        exit 1
    }
} catch {
    Write-Host "[ERROR] TypeScript check failed" -ForegroundColor Red
    exit 1
}

# Test build
Write-Host ""
Write-Host "Testing build..." -ForegroundColor Yellow
$env:GENERATE_SOURCEMAP = "false"
$env:CI = "false"

try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build successful!" -ForegroundColor Green
        
        if (Test-Path "build") {
            Write-Host "[OK] Build folder created" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Build folder missing" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Build failed:" -ForegroundColor Red
        $buildOutput | Select-Object -Last 10
        exit 1
    }
} catch {
    Write-Host "[ERROR] Build process failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS! Ready for mobile build." -ForegroundColor Green
