@echo off
echo ===================================
echo Проверка чистых архивов
echo ===================================

if not exist "frontend-clean.zip" (
    echo ❌ frontend-clean.zip не найден!
    pause
    exit
)

if not exist "backend-clean.zip" (
    echo ❌ backend-clean.zip не найден!
    pause
    exit
)

echo Содержимое frontend-clean.zip:
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('frontend-clean.zip').Entries | Select-Object Name | head -15"

echo.
echo Содержимое backend-clean.zip:
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('backend-clean.zip').Entries | Select-Object Name | head -15"

echo.
echo Проверка важных файлов:
powershell -Command "$frontendZip = [System.IO.Compression.ZipFile]::OpenRead('frontend-clean.zip'); $hasPackageJson = $frontendZip.Entries | Where-Object {$_.Name -eq 'package.json'}; if($hasPackageJson) { Write-Host '✅ Frontend package.json найден' -ForegroundColor Green } else { Write-Host '❌ Frontend package.json НЕ найден' -ForegroundColor Red }; $frontendZip.Dispose()"

powershell -Command "$backendZip = [System.IO.Compression.ZipFile]::OpenRead('backend-clean.zip'); $hasPackageJson = $backendZip.Entries | Where-Object {$_.Name -eq 'package.json'}; if($hasPackageJson) { Write-Host '✅ Backend package.json найден' -ForegroundColor Green } else { Write-Host '❌ Backend package.json НЕ найден' -ForegroundColor Red }; $backendZip.Dispose()"

echo.
echo ===================================
echo ✅ Проверка завершена!
echo ===================================
pause