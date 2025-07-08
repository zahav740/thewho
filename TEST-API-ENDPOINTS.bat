@echo off
echo ============================================
echo   ПРОВЕРКА API EXCEL IMPORT
echo ============================================
echo.

echo 🔍 Проверяем доступность API...
echo.

REM Проверка базовых эндпоинтов
echo 1. Health Check:
curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/health
echo.

echo 2. Excel Import Stats:
curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/excel-import/stats
echo.

echo 3. Excel Import Files:
curl -s -o nul -w "%%{http_code}" http://localhost:5100/api/excel-import/files
echo.

echo.
echo 🔍 Детальная проверка с выводом ошибок:
echo.

echo Health Check Response:
curl -s http://localhost:5100/api/health
echo.
echo.

echo Excel Import Stats Response:
curl -s http://localhost:5100/api/excel-import/stats
echo.
echo.

echo Excel Import Files Response:
curl -s http://localhost:5100/api/excel-import/files
echo.

echo ============================================
pause
