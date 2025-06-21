# Check ZIP Creation
Write-Host "Checking ZIP creation..." -ForegroundColor Yellow

if (Test-Path "build-mobile") {
    Write-Host "[OK] build-mobile folder exists" -ForegroundColor Green
    
    # Show contents
    Write-Host "`nContents of build-mobile:" -ForegroundColor Gray
    Get-ChildItem "build-mobile" | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor Gray }
    
    # Try creating ZIP
    Write-Host "`nCreating ZIP archive..." -ForegroundColor Yellow
    
    if (Test-Path "thewho-mobile.zip") {
        Remove-Item "thewho-mobile.zip" -Force
        Write-Host "Removed old ZIP file" -ForegroundColor Gray
    }
    
    try {
        Compress-Archive -Path "build-mobile\*" -DestinationPath "thewho-mobile.zip" -CompressionLevel Optimal -Force
        
        if (Test-Path "thewho-mobile.zip") {
            $zipSize = (Get-Item "thewho-mobile.zip").Length
            Write-Host "[SUCCESS] ZIP created: thewho-mobile.zip" -ForegroundColor Green
            Write-Host "ZIP size: $([math]::Round($zipSize/1MB, 2)) MB" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] ZIP file was not created" -ForegroundColor Red
        }
    } catch {
        Write-Host "[ERROR] Failed to create ZIP: $($_.Exception.Message)" -ForegroundColor Red
        
        Write-Host "`nTrying alternative method..." -ForegroundColor Yellow
        
        # Alternative method using 7-Zip if available
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            & 7z a "thewho-mobile.zip" "build-mobile\*"
            if (Test-Path "thewho-mobile.zip") {
                Write-Host "[SUCCESS] ZIP created with 7-Zip" -ForegroundColor Green
            }
        } else {
            Write-Host "Manual ZIP creation needed:" -ForegroundColor Yellow
            Write-Host "1. Open build-mobile folder" -ForegroundColor Gray
            Write-Host "2. Select all files (Ctrl+A)" -ForegroundColor Gray
            Write-Host "3. Right-click -> Send to -> Compressed folder" -ForegroundColor Gray
            Write-Host "4. Rename to thewho-mobile.zip" -ForegroundColor Gray
        }
    }
    
} else {
    Write-Host "[ERROR] build-mobile folder not found" -ForegroundColor Red
    Write-Host "Run mobile-build.bat first" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
