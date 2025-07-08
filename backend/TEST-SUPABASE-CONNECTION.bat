@echo off
chcp 65001 >nul
echo =====================================================
echo  🧪 ТЕСТ ПОДКЛЮЧЕНИЯ К SUPABASE
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

node test-supabase-connection.js

echo.
pause
