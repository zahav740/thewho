@echo off
echo Installing ExcelJS types...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo Installing @types/exceljs...
call npm install --save-dev @types/exceljs

echo ✅ ExcelJS types installed successfully!
echo You can now restart TypeScript compilation.
pause
