@echo off
echo ============================================
echo  START IN BROWSER MODE (NO ELECTRON)
echo ============================================
echo.
echo This script will start the application in
echo regular browser mode without using Electron.
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
echo Creating browser mode configuration...
cd frontend
echo BROWSER=chrome > .env.local
echo ELECTRON_DISABLE_SECURITY_WARNINGS=true >> .env.local
echo REACT_APP_DISABLE_ELECTRON=true >> .env.local

echo.
echo Creating browser compatibility script...
if not exist src\utils (
    mkdir src\utils
)

echo // Force browser mode, disable Electron > src\utils\browserMode.js
echo window.isElectron = false; >> src\utils\browserMode.js
echo window.electronAPI = null; >> src\utils\browserMode.js
echo // Prevent native callback errors >> src\utils\browserMode.js
echo if (typeof window !== 'undefined') { >> src\utils\browserMode.js
echo   window.require = function() { >> src\utils\browserMode.js
echo     console.warn('Electron require called in browser mode - operation prevented'); >> src\utils\browserMode.js
echo     return null; >> src\utils\browserMode.js
echo   }; >> src\utils\browserMode.js
echo } >> src\utils\browserMode.js

:: Update index.tsx to import the browser mode script
if exist src\index.tsx (
    echo // Import browser mode > src\index.new.tsx
    echo import './utils/browserMode'; >> src\index.new.tsx
    type src\index.tsx >> src\index.new.tsx
    move /Y src\index.new.tsx src\index.tsx
    echo Fixed index.tsx for browser mode.
)

echo.
echo Returning to main directory...
cd ..

echo.
echo Starting backend...
start cmd /k "cd backend && npm start"

timeout /t 15 /nobreak > nul
echo.
echo Starting frontend in browser mode...
start cmd /k "cd frontend && npm start -- --no-electron"

echo.
echo ============================================
echo Browser mode enabled!
echo.
echo The application will now start in your default
echo web browser instead of using Electron.
echo.
echo This avoids all Electron-related errors.
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
