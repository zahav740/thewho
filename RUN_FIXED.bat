@echo off
chcp 65001 >nul
echo =====================================================
echo    EXCEL OEE/KPI GENERATOR - FIXED VERSION
echo =====================================================

python create_oee_excel_fixed.py

echo.
echo Press any key to continue...
pause >nul
