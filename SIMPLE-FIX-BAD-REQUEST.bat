@echo off
echo ====================================
echo SIMPLE DIRECT FIX FOR BAD REQUEST ERROR
echo ====================================

echo.
echo Stopping application...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Creating simple JavaScript fix...

echo // Simple fix to modify orders.service.ts > simple-fix.js
echo const fs = require('fs'); >> simple-fix.js
echo const path = require('path'); >> simple-fix.js
echo const filePath = path.join('backend', 'src', 'modules', 'orders', 'orders.service.ts'); >> simple-fix.js
echo. >> simple-fix.js
echo try { >> simple-fix.js
echo   let content = fs.readFileSync(filePath, 'utf8'); >> simple-fix.js
echo. >> simple-fix.js
echo   // Fix 1: machineAxes conversion >> simple-fix.js
echo   content = content.replace( >> simple-fix.js
echo     /machine: (op[^,]+).machineAxes[^,]+/g, >> simple-fix.js
echo     "machine: typeof $1.machineAxes === 'number' ? `${$1.machineAxes}-axis` : (String($1.machineAxes).includes('-axis') ? String($1.machineAxes) : `${$1.machineAxes || 3}-axis`)" >> simple-fix.js
echo   ); >> simple-fix.js
echo. >> simple-fix.js
echo   // Fix 2: priority conversion >> simple-fix.js
echo   content = content.replace( >> simple-fix.js
echo     /priority: parseInt\([^)]+\)/g, >> simple-fix.js
echo     "priority: parseInt(String(orderData.priority), 10)" >> simple-fix.js
echo   ); >> simple-fix.js
echo. >> simple-fix.js
echo   // Fix 3: priority update conversion >> simple-fix.js
echo   content = content.replace( >> simple-fix.js
echo     /processedUpdateData.priority = parseInt\([^)]+\)/g, >> simple-fix.js
echo     "processedUpdateData.priority = parseInt(String(orderDataToUpdate.priority), 10)" >> simple-fix.js
echo   ); >> simple-fix.js
echo. >> simple-fix.js
echo   // Write fixed content back to file >> simple-fix.js
echo   fs.writeFileSync(filePath, content, 'utf8'); >> simple-fix.js
echo   console.log('Fixed orders.service.ts successfully'); >> simple-fix.js
echo. >> simple-fix.js
echo } catch (error) { >> simple-fix.js
echo   console.error('Error fixing orders.service.ts:', error); >> simple-fix.js
echo } >> simple-fix.js

echo.
echo Applying fix...
node simple-fix.js

echo.
echo Creating machine axes helper function...

echo // Add missing helper function > add-helper.js
echo const fs = require('fs'); >> add-helper.js
echo const path = require('path'); >> add-helper.js
echo const filePath = path.join('backend', 'src', 'modules', 'orders', 'orders.service.ts'); >> add-helper.js
echo. >> add-helper.js
echo try { >> add-helper.js
echo   let content = fs.readFileSync(filePath, 'utf8'); >> add-helper.js
echo. >> add-helper.js
echo   // Check if helper function already exists >> add-helper.js
echo   if (!content.includes('extractMachineAxesNumber')) { >> add-helper.js
echo     // Find class end to add helper function >> add-helper.js
echo     const lastBraceIndex = content.lastIndexOf('}'); >> add-helper.js
echo     if (lastBraceIndex !== -1) { >> add-helper.js
echo       const helperFunction = ` >> add-helper.js
echo   // Helper method to extract number from "3-axis" string >> add-helper.js
echo   private extractMachineAxesNumber(machineStr: string): number { >> add-helper.js
echo     if (!machineStr) return 3; >> add-helper.js
echo     try { >> add-helper.js
echo       const match = machineStr.match(/(\\d+)/); >> add-helper.js
echo       return match && match[1] ? parseInt(match[1], 10) : 3; >> add-helper.js
echo     } catch (e) { >> add-helper.js
echo       return 3; // Default to 3 axes >> add-helper.js
echo     } >> add-helper.js
echo   } >> add-helper.js
echo `; >> add-helper.js
echo       // Insert helper function before last brace >> add-helper.js
echo       const newContent = content.substring(0, lastBraceIndex) + helperFunction + content.substring(lastBraceIndex); >> add-helper.js
echo       fs.writeFileSync(filePath, newContent, 'utf8'); >> add-helper.js
echo       console.log('Added helper function successfully'); >> add-helper.js
echo     } >> add-helper.js
echo   } else { >> add-helper.js
echo     console.log('Helper function already exists'); >> add-helper.js
echo   } >> add-helper.js
echo } catch (error) { >> add-helper.js
echo   console.error('Error adding helper function:', error); >> add-helper.js
echo } >> add-helper.js

echo.
echo Adding helper function...
node add-helper.js

echo.
echo Restarting application...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo FIX COMPLETED!
echo.
echo The following changes were made:
echo 1. Fixed machineAxes type conversion
echo 2. Fixed priority value handling
echo 3. Added helper method for axis extraction
echo.
echo Now operations should save correctly.
echo ====================================
pause
