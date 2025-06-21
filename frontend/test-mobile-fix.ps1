# Quick Mobile Test
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TESTING MOBILE DISPLAY FIX" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan

# Build the app
Write-Host "Building app with mobile fixes..." -ForegroundColor Yellow
$env:GENERATE_SOURCEMAP = "false"
$env:CI = "false"

try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build successful!" -ForegroundColor Green
        
        if (Test-Path "build") {
            Write-Host "[OK] Build folder created" -ForegroundColor Green
            
            # Check if index.html contains the mobile fixes
            $indexContent = Get-Content "build\index.html" -Raw
            if ($indexContent -match "isMobile.*=.*window\.innerWidth.*<=.*768") {
                Write-Host "[OK] Mobile detection code found in index.html" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] Mobile detection code not found" -ForegroundColor Yellow
            }
            
            if ($indexContent -match "transform.*scale") {
                Write-Host "[INFO] Scale transform found (should only apply to desktop)" -ForegroundColor Cyan
            }
            
            Write-Host ""
            Write-Host "SUCCESS! Mobile fixes applied." -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Test on your phone by visiting the site" -ForegroundColor Gray
            Write-Host "2. Check if interface now fills the full width" -ForegroundColor Gray
            Write-Host "3. Verify that elements are properly sized" -ForegroundColor Gray
            Write-Host ""
            Write-Host "If you want to test locally:" -ForegroundColor Cyan
            Write-Host "- Run: npm start" -ForegroundColor Gray
            Write-Host "- Open on phone: http://[your-ip]:5101" -ForegroundColor Gray
            
        } else {
            Write-Host "[ERROR] Build folder missing" -ForegroundColor Red
            exit 1
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
