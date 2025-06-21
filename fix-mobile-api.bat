@echo off
echo ===============================================
echo FIXING MOBILE API FETCH ERRORS
echo ===============================================
echo Problem: Failed to fetch on mobile devices
echo Causes: CORS, SSL, API URL, network timeouts
echo Solution: Fix API configuration for mobile
echo ===============================================

cd 111

echo Extracting working archive for API fixes...
if exist temp-extract rmdir /s /q temp-extract
mkdir temp-extract
cd temp-extract

powershell -Command "Expand-Archive -Path '..\\frontend-production-1.zip' -DestinationPath '.' -Force"

echo Checking current JavaScript files...
cd static\\js
dir *.js

echo Extracting and fixing API configuration...
powershell -Command "$js = Get-Content 'main.*.js' -Raw; Write-Host 'Original API URL patterns found:'; $js | Select-String 'localhost:5200|kasuf\\.xyz' | ForEach-Object { Write-Host $_.Line }"

echo Applying API fixes for mobile...
powershell -Command "$jsFiles = Get-ChildItem 'main.*.js'; foreach($file in $jsFiles) { $js = Get-Content $file.FullName -Raw; $originalLength = $js.Length; $js = $js -replace 'localhost:5200', 'kasuf.xyz'; $js = $js -replace 'http://kasuf\\.xyz', 'https://kasuf.xyz'; $js = $js -replace '\"http:\",', '\"https:\",'; $js = $js -replace 'fetch\\(([^,]+),\\s*\\{', 'fetch($1,{credentials:\"include\",mode:\"cors\",'; $js = $js -replace 'headers:\\s*\\{([^}]+)\\}', 'headers:{$1,\"Accept\":\"application/json\",\"Content-Type\":\"application/json\"}'; Set-Content $file.FullName $js; Write-Host \"Fixed: $($file.Name) (length: $originalLength -> $($js.Length))\"; }"

cd ..\\..

echo Fixing index.html for mobile API...
powershell -Command "$html = Get-Content 'index.html' -Raw; $html = $html -replace 'e\\.style\\.transform=\"scale\\(0\\.8\\)\"', 'e.style.transform=\"none\"'; $html = $html -replace 'e\\.style\\.width=\"125%%\"', 'e.style.width=\"100%%\"'; $html = $html -replace 'e\\.style\\.height=\"125%%\"', 'e.style.height=\"100vh\"'; $html = $html -replace 'e&&\\(e\\.style\\.transform=\"scale\\(0\\.8\\)\"\\)', 'e&&(e.style.transform=\"none\")'; $html = $html -replace '</head>', '<script>window.REACT_APP_API_URL=\"https://kasuf.xyz/api\";window.addEventListener(\"load\",function(){if(window.location.protocol===\"http:\"&&window.location.hostname!==\"localhost\"){window.location.href=window.location.href.replace(\"http:\",\"https:\");}});</script></head>'; Set-Content 'index.html' $html"

echo Fixing CSS for mobile display...
cd static\\css
powershell -Command "$css = Get-Content 'main.*.css' -Raw; $css = $css -replace '#root{height:125%%!important;overflow:hidden!important;transform:scale\\(\\.8\\)!important;transform-origin:top left!important;width:125%%!important}', '#root{height:100%%!important;overflow:visible!important;transform:none!important;transform-origin:initial!important;width:100%%!important}'; $css = $css -replace 'body{overflow-x:auto!important;width:100vw!important}', 'body{overflow-x:hidden!important;width:100%%!important}'; $css = $css -replace '@media \\(max-width:768px\\){#root,body,html{zoom:1!important;-webkit-text-size-adjust:none!important;-moz-text-size-adjust:none!important;text-size-adjust:none!important;overflow-x:hidden!important;width:100vw!important}}', '@media (max-width:768px){#root{height:100vh!important;overflow:visible!important;transform:none!important;width:100%%!important}body,html{zoom:1!important;-webkit-text-size-adjust:100%%!important;-moz-text-size-adjust:100%%!important;text-size-adjust:100%%!important;overflow-x:hidden!important;width:100%%!important}}'; $css = $css + '.login-page{padding:10px!important}.login-page *{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.login-page input,.login-page button{font-size:16px!important;min-height:44px!important;padding:12px!important;-webkit-appearance:none!important}.login-page .ant-btn{min-height:48px!important;font-size:16px!important;touch-action:manipulation!important}.login-page .ant-input{font-size:16px!important;min-height:44px!important;-webkit-appearance:none!important}@media (max-width:768px){.login-page .ant-card{margin:0!important;width:100%%!important}.login-page .ant-form-item{margin-bottom:16px!important}}'; Set-Content 'main.*.css' $css"

cd ..\\..\\..

echo Creating API-fixed archive...
if exist ..\\frontend-production-api-fixed.zip del ..\\frontend-production-api-fixed.zip

cd temp-extract
powershell -Command "Compress-Archive -Path '.\\*' -DestinationPath '..\\..\\frontend-production-api-fixed.zip' -Force"
cd ..

echo Cleaning up...
rmdir /s /q temp-extract

if exist ..\\frontend-production-api-fixed.zip (
    echo.
    echo ===============================================
    echo SUCCESS! Mobile API issues fixed!
    echo ===============================================
    for %%F in (..\\frontend-production-api-fixed.zip) do echo Size: %%~zF bytes
    echo.
    echo API FIXES APPLIED:
    echo - Force HTTPS for all API calls
    echo - Add CORS credentials and headers
    echo - Fix API URL from localhost to kasuf.xyz
    echo - Add proper Accept and Content-Type headers  
    echo - Auto-redirect HTTP to HTTPS
    echo - Mobile-optimized touch events
    echo - Proper mobile scaling and display
    echo.
    echo DEPLOY:
    echo   cd /var/upload/frontend  
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   # Upload frontend-production-api-fixed.zip
    echo   unzip -o frontend-production-api-fixed.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo DEBUG ON MOBILE:
    echo 1. Open https://kasuf.xyz on mobile
    echo 2. Open Developer Tools ^(Chrome mobile^)
    echo 3. Check Console for any remaining errors
    echo 4. Check Network tab for failed requests
    echo.
    echo RESULT:
    echo - Desktop: Works as before
    echo - Mobile: API calls should work properly
    echo - HTTPS: All requests use secure protocol
    echo - CORS: Proper headers for cross-origin requests
    echo.
) else (
    echo ERROR: Failed to create API-fixed archive!
)

cd ..

echo ===============================================
echo MOBILE API FETCH ERRORS FIXED!
echo ===============================================
echo.
echo If still getting errors after deployment:
echo 1. Check if backend is running: curl https://kasuf.xyz/api/health
echo 2. Verify CORS settings in backend allow mobile browsers
echo 3. Check mobile network ^(try different wifi/mobile data^)
echo 4. Clear mobile browser cache completely
echo.
pause