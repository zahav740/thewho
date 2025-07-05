@echo off
echo ====================================
echo ЗАПУСК СИСТЕМЫ EXCEL ИМПОРТА
echo ====================================

echo.
echo [1/3] Checking backend...
cd backend
start "Backend" cmd /k "npm run start:dev"
echo ✅ Backend starting...

timeout /t 5

echo.
echo [2/3] Checking frontend...
cd ..\frontend
start "Frontend" cmd /k "npm start"
echo ✅ Frontend starting...

echo.
echo [3/3] Creating test Excel file...
cd ..
node create-test-excel.js
echo ✅ Test file created

echo.
echo ====================================
echo СИСТЕМА ЗАПУЩЕНА
echo ====================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5100
echo 📋 Database Page: http://localhost:3000/database
echo.
echo 🎯 Excel Маппер - кнопка в разделе База данных
echo 📋 История импорта - кнопка в разделе База данных
echo.
echo Тестовый файл: test_excel_import.xlsx
echo.
pause
