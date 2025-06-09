@echo off
echo ====================================
echo УСТАНОВКА EXCELJS
echo ====================================

cd frontend
echo Устанавливаем ExcelJS...
npm install exceljs
npm install --save-dev @types/node

echo ✅ ExcelJS установлен!
pause