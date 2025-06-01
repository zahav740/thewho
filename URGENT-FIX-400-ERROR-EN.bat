@echo off
echo ====================================
echo URGENT FIX FOR 400 BAD REQUEST ERROR
echo ====================================
echo.
echo Running patch to fix Bad Request error...
echo.

echo Stopping application...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Creating direct fix script...

echo // Direct fix for orders.service.ts > fix-orders-service.js
echo const fs = require('fs'); >> fix-orders-service.js
echo const path = require('path'); >> fix-orders-service.js
echo. >> fix-orders-service.js
echo // Read the service file >> fix-orders-service.js
echo const serviceFile = path.join(__dirname, 'backend', 'src', 'modules', 'orders', 'orders.service.ts'); >> fix-orders-service.js
echo let content = fs.readFileSync(serviceFile, 'utf8'); >> fix-orders-service.js
echo. >> fix-orders-service.js
echo // Fix machineAxes handling >> fix-orders-service.js
echo content = content.replace(/machine: opDto\.machineAxes \? `\$\{opDto\.machineAxes\}-axis` : '3-axis'/g, >> fix-orders-service.js
echo   "machine: typeof opDto.machineAxes === 'number' ? `${opDto.machineAxes}-axis` : (String(opDto.machineAxes).includes('-axis') ? String(opDto.machineAxes) : `${opDto.machineAxes || 3}-axis`)"); >> fix-orders-service.js
echo. >> fix-orders-service.js
echo // Fix priority conversion >> fix-orders-service.js
echo content = content.replace(/priority: parseInt\(orderData\.priority\)/g, >> fix-orders-service.js
echo   "priority: parseInt(String(orderData.priority), 10)"); >> fix-orders-service.js
echo content = content.replace(/processedUpdateData\.priority = parseInt\(orderDataToUpdate\.priority\)/g, >> fix-orders-service.js
echo   "processedUpdateData.priority = parseInt(String(orderDataToUpdate.priority), 10)"); >> fix-orders-service.js
echo. >> fix-orders-service.js
echo // Save changes >> fix-orders-service.js
echo fs.writeFileSync(serviceFile, content, 'utf8'); >> fix-orders-service.js
echo console.log('Patch successfully applied to orders.service.ts'); >> fix-orders-service.js

echo.
echo Applying fix...
node fix-orders-service.js

echo.
echo Restarting application...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo Patch successfully applied!
echo.
echo Operations saving should now work correctly.
echo ====================================
pause
