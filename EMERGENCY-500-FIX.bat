@echo off
echo ============================================
echo  EMERGENCY 500 ERROR FIX
echo ============================================
echo.
echo This script will apply emergency fixes to resolve
echo the 500 Internal Server Error in the API.
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
echo Applying emergency fixes...
cd backend\src\modules\orders

echo.
echo 1. Backing up original files...
copy /Y orders.service.ts orders.service.original.ts
copy /Y orders.module.ts orders.module.original.ts

echo.
echo 2. Installing emergency service version...
copy /Y orders.service.emergency.ts orders.service.ts
echo import { PdfFile } from '../../database/entities/pdf-file.entity';>> temp.txt
type orders.module.ts >> temp.txt
copy /Y temp.txt orders.module.ts
del temp.txt

echo.
echo 3. Returning to main directory...
cd ..\..\..\..

echo.
echo Starting backend...
start cmd /k "cd backend && npm start"

timeout /t 15 /nobreak > nul
echo.
echo Starting frontend...
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo Emergency fix applied!
echo.
echo The application should now work without 500 errors.
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
