@echo off
REM Production Readiness Check Script

echo 🔍 Production CRM - Readiness Check
echo =====================================
echo.

set /a CHECKS_PASSED=0
set /a TOTAL_CHECKS=8

echo 1️⃣ Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker is installed
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Docker is NOT installed
)

echo.
echo 2️⃣ Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Compose is installed
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Docker Compose is NOT installed
)

echo.
echo 3️⃣ Checking required files...
if exist "docker-compose.prod.yml" (
    echo ✅ docker-compose.prod.yml exists
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ docker-compose.prod.yml is missing
)

echo.
echo 4️⃣ Checking environment file...
if exist ".env.prod" (
    echo ✅ .env.prod exists
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ .env.prod is missing
)

echo.
echo 5️⃣ Checking backend Dockerfile...
if exist "backend\Dockerfile" (
    echo ✅ Backend Dockerfile exists
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Backend Dockerfile is missing
)

echo.
echo 6️⃣ Checking frontend Dockerfile...
if exist "frontend\Dockerfile" (
    echo ✅ Frontend Dockerfile exists
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Frontend Dockerfile is missing
)

echo.
echo 7️⃣ Checking nginx configuration...
if exist "frontend\nginx.conf" (
    echo ✅ Nginx configuration exists
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Nginx configuration is missing
)

echo.
echo 8️⃣ Checking port availability...
netstat -an | findstr ":80 " >nul 2>&1
if %errorlevel% neq 0 (
    echo ✅ Port 80 is available
    set /a CHECKS_PASSED+=1
) else (
    echo ❌ Port 80 is already in use
)

echo.
echo ================================================
echo 📊 RESULTS: %CHECKS_PASSED%/%TOTAL_CHECKS% checks passed
echo ================================================

if %CHECKS_PASSED% equ %TOTAL_CHECKS% (
    echo.
    echo 🎉 SUCCESS! System is ready for production deployment
    echo.
    echo 🚀 To deploy, run: deploy.bat
    echo 📊 To monitor, run: monitor.bat
) else (
    echo.
    echo ⚠️  WARNING! Some checks failed. Please fix the issues above before deploying.
    echo.
    echo 📋 Common fixes:
    echo - Install Docker Desktop from https://docker.com/
    echo - Make sure all configuration files are present
    echo - Stop services using port 80 (IIS, Apache, etc.)
)

echo.
echo 📄 For detailed deployment guide, see: PRODUCTION-DEPLOYMENT.md
echo.

pause
