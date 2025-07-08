@echo off
chcp 65001 >nul
cls
echo ================================================================================
echo    ADVANCED OEE/KPI GENERATOR v3.0
echo ================================================================================
echo.
echo New Features:
echo [+] Production remaining with defect compensation
echo [+] Personal KPI for operators: Andrey, Denis, Daniel, Kirill, Slava, Arkady
echo [+] Separate sheets for stations: Doosan Yashana, Doosan Hadasha, Doosan 3
echo [+] Pinnacle Gdola, Mitsubishi, JohnFord, Okuma
echo [+] Modern Dashboard
echo [+] Gantt Chart
echo [+] Fixed headers
echo [+] Dropdown lists
echo [+] FIXED all #NAME? errors
echo.
echo ================================================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo Starting Python script...
python script_name.py

echo.
echo DONE! Check the created Excel file.
echo.
pause