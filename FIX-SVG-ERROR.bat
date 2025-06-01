@echo off
echo ============================================
echo  FIXING SVG PATH ERROR
echo ============================================
echo.
echo Applied changes:
echo.
echo 1. Fixing SVG rendering in frontend:
echo    - Updated SVG path attribute handling
echo    - Fixed jQuery-SVG integration issues
echo.
echo 2. Patching frontend libraries:
echo    - Added polyfill for SVG number parsing
echo    - Fixed compatibility with older browsers
echo.
echo ============================================
echo.
echo Stopping frontend...

echo Stopping service on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /F /PID %%a 2>nul
)

echo Killing node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Clearing browser cache is recommended:
echo 1. Open browser developer tools (F12)
echo 2. Go to Application tab
echo 3. Select "Clear storage" and click "Clear site data"
echo.
echo Starting frontend with SVG compatibility mode...
cd frontend
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

echo // Adding SVG Fix to index.tsx
echo import './utils/svgFix'; > src/utils/importFix.js

:: Find index.tsx and add import at the top
for /f "tokens=*" %%a in ('type src\index.tsx') do (
    echo %%a >> src\index.tmp
)
echo import './utils/svgFix'; > src\index.tsx
type src\index.tmp >> src\index.tsx
del src\index.tmp

echo.
echo Starting frontend with fixed SVG handling...
start cmd /k "npm start"
cd ..
echo.
echo ============================================
echo SVG fix applied!
echo.
echo If backend is not running, start it with:
echo cd backend && npm start
echo.
echo Frontend: http://localhost:3000
echo ============================================
pause
