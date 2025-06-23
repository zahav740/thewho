@echo off
chcp 65001 >nul
echo =====================================================
echo  🧪 ТЕСТ ПОДКЛЮЧЕНИЯ К ЛОКАЛЬНОЙ POSTGRESQL
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

node test-local-postgresql.js

echo.
pause
