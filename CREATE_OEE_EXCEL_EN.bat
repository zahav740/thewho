@echo off
chcp 65001 >nul
echo =====================================================
echo    CREATING EXCEL FILE OEE/KPI FOR PRODUCTION
echo =====================================================
echo.

echo Checking Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found! Install Python from python.org
    pause
    exit /b 1
)

echo.
echo Installing required libraries...
pip install openpyxl pandas

echo.
echo Running Excel generator...
python create_oee_excel_fixed.py

echo.
echo DONE! Check folder for new Excel file.
echo.
pause
