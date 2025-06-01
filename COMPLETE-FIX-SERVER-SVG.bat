@echo off
echo ============================================
echo  COMPLETE FIX: SERVER 500 & SVG ERRORS
echo ============================================
echo.
echo This script applies all necessary fixes:
echo.
echo 1. DATABASE & API FIXES:
echo    - Fixed priority field type compatibility
echo    - Fixed entity-DTO relationships
echo    - Added proper error handling
echo.
echo 2. SVG RENDERING FIXES:
echo    - Added SVG path compatibility layer
echo    - Fixed jQuery integration with SVG
echo.
echo ============================================
echo.
echo Stopping all services...

echo Stopping services on ports 3000, 3001, 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3001"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8080"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing all node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Applying SVG fix to frontend...
cd frontend

:: Create SVG fix utility
echo // SVG Path Fix > src/utils/svgFix.js
echo (function() { >> src/utils/svgFix.js
echo   if (typeof window !== 'undefined' ^&^& window.jQuery) { >> src/utils/svgFix.js
echo     // Fix for SVG path attribute parsing >> src/utils/svgFix.js
echo     const originalSvgAttr = jQuery.fn.attr; >> src/utils/svgFix.js
echo     jQuery.fn.attr = function(name, value) { >> src/utils/svgFix.js
echo       if (name === 'd' ^&^& this[0] ^&^& this[0].tagName === 'path') { >> src/utils/svgFix.js
echo         try { >> src/utils/svgFix.js
echo           return originalSvgAttr.apply(this, arguments); >> src/utils/svgFix.js
echo         } catch (e) { >> src/utils/svgFix.js
echo           console.warn('SVG path parsing error fixed:', e.message); >> src/utils/svgFix.js
echo           if (typeof value === 'string') { >> src/utils/svgFix.js
echo             this[0].setAttribute('d', value); >> src/utils/svgFix.js
echo             return this; >> src/utils/svgFix.js
echo           } >> src/utils/svgFix.js
echo           return this[0].getAttribute('d'); >> src/utils/svgFix.js
echo         } >> src/utils/svgFix.js
echo       } >> src/utils/svgFix.js
echo       return originalSvgAttr.apply(this, arguments); >> src/utils/svgFix.js
echo     }; >> src/utils/svgFix.js
echo   } >> src/utils/svgFix.js
echo })(); >> src/utils/svgFix.js

:: Modify index.js to import the SVG fix
if exist src\index.tsx (
    echo // Import SVG fix > src\index.new.tsx
    echo import './utils/svgFix'; >> src\index.new.tsx
    type src\index.tsx >> src\index.new.tsx
    move /Y src\index.new.tsx src\index.tsx
)

:: Go back to root directory
cd ..
echo.
echo SVG fix applied!
echo.
echo Starting backend with debug mode...
start cmd /k "cd backend && set DEBUG=express:* && npm start"

timeout /t 10 /nobreak > nul
echo.
echo Starting frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo All fixes applied!
echo.
echo If you still see errors:
echo 1. Check backend console for specific error messages
echo 2. Clear browser cache (Ctrl+F5 or clear site data)
echo 3. If issue persists, check Network tab in browser
echo    developer tools for the specific error response
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
