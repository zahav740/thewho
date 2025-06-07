@echo off
echo Checking registered routes in backend logs...
echo.
echo Look for lines containing "OrdersFilesystemController" in your backend console
echo The routes should be:
echo   /api/filesystem/orders
echo   /api/filesystem/orders/statistics/overview
echo   /api/filesystem/orders/export-all
echo   etc.
echo.
echo If you don't see these routes, there's a registration problem.
echo.
pause
