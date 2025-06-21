@echo off
echo ===================================
echo Проверка содержимого архивов
echo ===================================

echo Проверка frontend-beget-new.zip:
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('frontend-beget-new.zip').Entries | Select-Object Name | head -10"

echo.
echo Проверка backend-beget-new.zip:
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('backend-beget-new.zip').Entries | Select-Object Name | head -10"

echo.
echo Проверка наличия важных файлов:
powershell -Command "$frontendZip = [System.IO.Compression.ZipFile]::OpenRead('frontend-beget-new.zip'); $hasPackageJson = $frontendZip.Entries | Where-Object {$_.Name -eq 'package.json'}; if($hasPackageJson) { Write-Host '✅ Frontend package.json найден' -ForegroundColor Green } else { Write-Host '❌ Frontend package.json НЕ найден' -ForegroundColor Red }; $frontendZip.Dispose()"

powershell -Command "$backendZip = [System.IO.Compression.ZipFile]::OpenRead('backend-beget-new.zip'); $hasPackageJson = $backendZip.Entries | Where-Object {$_.Name -eq 'package.json'}; if($hasPackageJson) { Write-Host '✅ Backend package.json найден' -ForegroundColor Green } else { Write-Host '❌ Backend package.json НЕ найден' -ForegroundColor Red }; $backendZip.Dispose()"

pause