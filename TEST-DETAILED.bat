@echo off
echo ========================================
echo COMPLETE FILESYSTEM FUNCTIONALITY TEST
echo ========================================
echo.

set SERVER_URL=http://localhost:5100

echo 1. Getting order TH1K4108A details...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A | jq .
echo.

echo 2. Getting versions of TH1K4108A...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A/versions | jq .
echo.

echo 3. Getting specific version...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A/versions/2025-06-07 | jq .
echo.

echo 4. Testing shift data...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A/shifts | jq .
echo.

echo 5. Testing planning data...
curl -s %SERVER_URL%/api/filesystem/orders/TH1K4108A/planning | jq .
echo.

echo Test completed!
pause
