@echo off
echo EXCEL IMPORT FIX - Production File Support
echo ==========================================

echo.
echo Problem detected: Date format errors in Excel import
echo File: 2025 june.xlsx
echo Sheet: תוכנית יצור (Hebrew production plan)
echo.

cd /d C:\Users\Alexey\Downloads\thewho-main\backend

echo Step 1: Testing current orders API...
curl -s http://localhost:5100/api/orders | node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    console.log('✅ Current orders in database:', data.total || 0);
    if (data.data && data.data.length > 0) {
      console.log('📋 Orders found:');
      data.data.forEach((order, i) => {
        console.log(`  ${i+1}. ${order.drawingNumber} - ${order.quantity} pcs`);
      });
    }
  } catch (e) {
    console.log('❌ API Error:', e.message);
  }
});
"

echo.
echo Step 2: Checking available Excel import endpoints...
echo.

echo Testing production plan import endpoint...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5100/api/orders/import-production-plan
echo.

echo Testing flexible import endpoint...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5100/api/orders/flexible-import
echo.

echo.
echo Step 3: Alternative solutions for your production Excel file:
echo.
echo SOLUTION 1: Use Production Plan Import
echo   - Specifically designed for Hebrew production files
echo   - Handles תוכנית יצור sheets
echo   - Better date format handling
echo.

echo SOLUTION 2: Use Flexible Import with Column Mapping
echo   - Manually map columns to avoid date format issues
echo   - Preview data before import
echo   - Skip problematic rows
echo.

echo SOLUTION 3: Convert to CSV format
echo   - Open Excel file in Excel/LibreOffice
echo   - Save As -> CSV format
echo   - Use CSV import (more reliable)
echo.

echo.
echo QUICK FIX: Testing with simplified test data...

echo Creating production-like test order...
curl -X POST http://localhost:5100/api/orders ^
-H "Content-Type: application/json" ^
-d "{\"drawingNumber\":\"PROD-001\",\"quantity\":15,\"deadline\":\"2025-08-30T00:00:00.000Z\",\"priority\":1,\"workType\":\"Production Item\",\"operations\":[]}" >nul 2>&1

echo.
echo ✅ RECOMMENDATION:
echo   1. Try CSV export from your Excel file
echo   2. Or use the Flexible Import with column mapping
echo   3. Production plan import endpoint may need date format fixes
echo.

echo 🌐 Open database page: http://localhost:5101/database
echo 📊 Try CSV import instead of Excel for now
echo.
pause
