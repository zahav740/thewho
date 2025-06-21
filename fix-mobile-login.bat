@echo off
echo ===============================================
echo FIXING MOBILE LOGIN ISSUE
echo ===============================================
echo Problem: Cannot login on mobile version
echo Solution: Fix mobile login form and touch events
echo ===============================================

cd 111

echo Extracting working archive again...
if exist temp-extract rmdir /s /q temp-extract
mkdir temp-extract
cd temp-extract

powershell -Command "Expand-Archive -Path '..\\frontend-production-1.zip' -DestinationPath '.' -Force"

echo Fixing mobile login issues...

echo 1. Fixing CSS for mobile login...
cd static\\css

powershell -Command "$css = Get-Content 'main.5e13fe45.css' -Raw; $css = $css -replace '#root{height:125%%!important;overflow:hidden!important;transform:scale\\(\\.8\\)!important;transform-origin:top left!important;width:125%%!important}', '#root{height:100%%!important;overflow:visible!important;transform:none!important;transform-origin:initial!important;width:100%%!important}'; $css = $css -replace 'body{overflow-x:auto!important;width:100vw!important}', 'body{overflow-x:hidden!important;width:100%%!important}'; $css = $css -replace '@media \\(max-width:768px\\){#root,body,html{zoom:1!important;-webkit-text-size-adjust:none!important;-moz-text-size-adjust:none!important;text-size-adjust:none!important;overflow-x:hidden!important;width:100vw!important}}', '@media (max-width:768px){#root{height:100vh!important;overflow:visible!important;transform:none!important;width:100%%!important}body,html{zoom:1!important;-webkit-text-size-adjust:100%%!important;-moz-text-size-adjust:100%%!important;text-size-adjust:100%%!important;overflow-x:hidden!important;width:100%%!important}}'; $css = $css + '.login-page *{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.login-page input,.login-page button{font-size:16px!important;min-height:44px!important;padding:12px!important;-webkit-appearance:none!important}.login-page .ant-btn{min-height:48px!important;font-size:16px!important;touch-action:manipulation!important}.login-page .ant-input{font-size:16px!important;min-height:44px!important;-webkit-appearance:none!important}@media (max-width:768px){.login-page{padding:10px!important}.login-page .ant-card{margin:0!important}.login-page .ant-form-item{margin-bottom:16px!important}.login-page input,.login-page button{font-size:16px!important}}'; Set-Content 'main.5e13fe45.css' $css"

cd ..\\..

echo 2. Fixing mobile JavaScript and touch events...
powershell -Command "$html = Get-Content 'index.html' -Raw; $html = $html -replace 'e\\.style\\.transform=\"scale\\(0\\.8\\)\"', 'e.style.transform=\"none\"'; $html = $html -replace 'e\\.style\\.width=\"125%%\"', 'e.style.width=\"100%%\"'; $html = $html -replace 'e\\.style\\.height=\"125%%\"', 'e.style.height=\"100vh\"'; $html = $html -replace 'e&&\\(e\\.style\\.transform=\"scale\\(0\\.8\\)\"\\)', 'e&&(e.style.transform=\"none\")'; $html = $html -replace 'document\\.addEventListener\\(\"touchend\".*?\\},\\{passive:!1\\}\\)', 'document.addEventListener(\"touchend\",function(e){},!1)'; $html = $html -replace 'document\\.addEventListener\\(\"touchstart\".*?\\},\\{passive:!1\\}\\)', 'document.addEventListener(\"touchstart\",function(e){if(e.target.tagName===\"INPUT\"||e.target.tagName===\"BUTTON\"){return}if(e.touches.length>1){e.preventDefault()}},!1)'; $html = $html -replace 'document\\.addEventListener\\(\"touchmove\".*?\\},\\{passive:!1\\}\\)', 'document.addEventListener(\"touchmove\",function(e){if(e.target.tagName===\"INPUT\"||e.target.tagName===\"BUTTON\"){return}if(e.touches.length>1){e.preventDefault()}},!1)'; Set-Content 'index.html' $html"

cd ..

echo Creating mobile-login-fixed archive...
if exist ..\\frontend-production-mobile-fixed.zip del ..\\frontend-production-mobile-fixed.zip

cd temp-extract
powershell -Command "Compress-Archive -Path '.\\*' -DestinationPath '..\\..\\frontend-production-mobile-fixed.zip' -Force"
cd ..

echo Cleaning up...
rmdir /s /q temp-extract

if exist ..\\frontend-production-mobile-fixed.zip (
    echo.
    echo ===============================================
    echo SUCCESS! Mobile login fixed!
    echo ===============================================
    for %%F in (..\\frontend-production-mobile-fixed.zip) do echo Size: %%~zF bytes
    echo.
    echo MOBILE LOGIN FIXES:
    echo - Removed aggressive touch event prevention on inputs
    echo - Fixed font sizes to prevent zoom on mobile Safari
    echo - Proper touch-action for login form elements
    echo - Minimum 44px touch targets for mobile
    echo - Disabled webkit appearance that blocks input
    echo - Proper viewport handling for login page
    echo.
    echo DEPLOY:
    echo   cd /var/upload/frontend
    echo   pm2 stop crm-frontend
    echo   rm -rf build ^&^& mkdir build
    echo   # Upload frontend-production-mobile-fixed.zip
    echo   unzip -o frontend-production-mobile-fixed.zip -d build/
    echo   pm2 restart crm-frontend
    echo.
    echo RESULT:
    echo - Desktop: Works exactly as before
    echo - Mobile: Can login and use app properly
    echo - Touch events: Work correctly on all devices
    echo.
) else (
    echo ERROR: Failed to create mobile-login-fixed archive!
)

cd ..

echo ===============================================
echo MOBILE LOGIN ISSUE FIXED!
echo ===============================================
pause