@echo off
REM Production Monitoring Script

echo 📊 Production CRM - Status Monitor
echo ================================

:loop
cls
echo 📅 %date% %time%
echo.

echo 🐳 Docker Containers Status:
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

echo.
echo 💾 Database Status:
docker exec production_crm_db pg_isready -U postgres -d production_crm

echo.
echo 🌐 Services Health Check:
echo Frontend: 
curl -s -o nul -w "HTTP %%{http_code} - Response time: %%{time_total}s\n" http://localhost/

echo Backend API:
curl -s -o nul -w "HTTP %%{http_code} - Response time: %%{time_total}s\n" http://localhost:3000/api/health

echo.
echo 📊 System Resources:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo.
echo 📜 Recent Logs (last 5 lines):
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=5

echo.
echo ⏰ Next update in 30 seconds... (Press Ctrl+C to exit)
timeout /t 30 /nobreak >nul
goto loop
