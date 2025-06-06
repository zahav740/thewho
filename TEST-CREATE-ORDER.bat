@echo off
echo ====================================
echo TEST ORDER CREATION WITH OPERATIONS
echo ====================================
echo.

echo This script will test creating an order with operations via API
echo.

echo Step 1: Testing API connection...
curl -s http://localhost:5101/api/health
echo.
echo.

echo Step 2: Creating test order with operations...
echo.

curl -X POST http://localhost:5101/api/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"drawingNumber\":\"TEST-API-001\",\"quantity\":5,\"deadline\":\"2025-07-15\",\"priority\":2,\"workType\":\"Test via API\",\"operations\":[{\"operationNumber\":10,\"operationType\":\"MILLING\",\"machineAxes\":3,\"estimatedTime\":90},{\"operationNumber\":20,\"operationType\":\"TURNING\",\"machineAxes\":4,\"estimatedTime\":120}]}"

echo.
echo.

echo Step 3: Checking if order was created with operations...
echo Fetching all orders:
curl -s http://localhost:5101/api/orders | findstr "TEST-API-001"

echo.
echo.

echo ====================================
echo TEST COMPLETED
echo ====================================
echo.
echo Check the backend console for detailed logs
echo Look for lines containing "OrdersService.create"
echo.
pause
