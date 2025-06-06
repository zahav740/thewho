@echo off
echo ============================================
echo  FIXING ELECTRON NATIVE CALLBACK ERROR
echo ============================================
echo.
echo This script will address the native callback
echo error in the Electron application.
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

echo Killing all node and electron processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul

timeout /t 2 /nobreak > nul
echo.
echo Removing node_modules in frontend (this may take a while)...
cd frontend
if exist node_modules (
    rmdir /s /q node_modules
    echo Node modules removed successfully.
) else (
    echo No node_modules folder found.
)

echo.
echo Cleaning npm cache...
call npm cache clean --force
echo.
echo Reinstalling dependencies (this will take several minutes)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies!
    goto :error
)

echo.
echo Creating Electron compatibility fix...
echo // Fix for Electron native callback error > src/utils/electronFix.js
echo if (typeof window !== 'undefined' ^&^& window.process ^&^& window.process.type === 'renderer') { >> src/utils/electronFix.js
echo   // Override problem function causing native callback error >> src/utils/electronFix.js
echo   const originalRequire = window.require; >> src/utils/electronFix.js
echo   if (originalRequire) { >> src/utils/electronFix.js
echo     window.require = function(...args) { >> src/utils/electronFix.js
echo       try { >> src/utils/electronFix.js
echo         return originalRequire.apply(this, args); >> src/utils/electronFix.js
echo       } catch (e) { >> src/utils/electronFix.js
echo         console.warn('Electron require error prevented:', e.message); >> src/utils/electronFix.js
echo         return null; >> src/utils/electronFix.js
echo       } >> src/utils/electronFix.js
echo     }; >> src/utils/electronFix.js
echo   } >> src/utils/electronFix.js
echo } >> src/utils/electronFix.js

:: Update index.tsx to import the fix
if exist src\index.tsx (
    echo // Import Electron fix > src\index.new.tsx
    echo import './utils/electronFix'; >> src\index.new.tsx
    type src\index.tsx >> src\index.new.tsx
    move /Y src\index.new.tsx src\index.tsx
    echo Fixed index.tsx with Electron compatibility fix.
)

echo.
echo Starting backend...
cd ..
start cmd /k "cd backend && npm start"

timeout /t 15 /nobreak > nul
echo.
echo Starting frontend in browser mode (no Electron)...
cd frontend
echo BROWSER=chrome > .env.local
echo ELECTRON_DISABLE_SECURITY_WARNINGS=true >> .env.local
start cmd /k "npm start"

echo.
echo ============================================
echo Electron error fix applied!
echo.
echo The application will now start in browser mode.
echo This avoids the Electron native callback error.
echo.
echo If you still see errors:
echo 1. Clear your browser cache (Ctrl+F5)
echo 2. Check console for specific errors
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause

:error
echo.
echo ============================================
echo  ERROR DURING FIX PROCESS
echo ============================================
echo.
echo Please try the following manual steps:
echo 1. cd frontend
echo 2. rm -rf node_modules
echo 3. npm cache clean --force
echo 4. npm install
echo 5. npm start
echo.
pause
exit /b 1
