@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: =================================================================
:: MASTER SCRIPT FOR PREPARING COMPLETE BEGET DEPLOYMENT PACKAGE
:: =================================================================

echo ====================================================================
echo PRODUCTION CRM - BEGET DEPLOYMENT PREPARATION
echo ====================================================================

set "BASE_DIR=%~dp0"
set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"
set "COMPLETE_ZIP=production-crm-beget-complete-!TIMESTAMP!.zip"
set "TEMP_COMPLETE=%BASE_DIR%temp-complete-beget"

echo Current time: %date% %time%
echo Base directory: !BASE_DIR!
echo.

echo ====================================================================
echo STEP 1: PREPARING BACKEND
echo ====================================================================

call "!BASE_DIR!prepare-backend-beget.bat"
if !errorlevel! neq 0 (
    echo ERROR: Backend preparation failed!
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo STEP 2: PREPARING FRONTEND
echo ====================================================================

call "!BASE_DIR!prepare-frontend-beget.bat"
if !errorlevel! neq 0 (
    echo ERROR: Frontend preparation failed!
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo STEP 3: CREATING COMPLETE DEPLOYMENT PACKAGE
echo ====================================================================

echo Creating complete deployment package...

:: Clean up previous temp directory
if exist "!TEMP_COMPLETE!" rmdir /s /q "!TEMP_COMPLETE!"
mkdir "!TEMP_COMPLETE!"

:: Create structure
mkdir "!TEMP_COMPLETE!\backend"
mkdir "!TEMP_COMPLETE!\frontend"
mkdir "!TEMP_COMPLETE!\deploy-scripts"
mkdir "!TEMP_COMPLETE!\documentation"

echo Extracting backend archive...
powershell -command "Expand-Archive -Path '!BASE_DIR!backend-beget.zip' -DestinationPath '!TEMP_COMPLETE!\backend' -Force"

echo Extracting frontend archive...
powershell -command "Expand-Archive -Path '!BASE_DIR!frontend-beget.zip' -DestinationPath '!TEMP_COMPLETE!\frontend' -Force"

:: Copy deployment configurations
echo Copying deployment configurations...
if exist "!BASE_DIR!\.env.beget" copy "!BASE_DIR!\.env.beget" "!TEMP_COMPLETE!\"
if exist "!BASE_DIR!\.env.production" copy "!BASE_DIR!\.env.production" "!TEMP_COMPLETE!\"
if exist "!BASE_DIR!\docker-compose.beget.yml" copy "!BASE_DIR!\docker-compose.beget.yml" "!TEMP_COMPLETE!\"
if exist "!BASE_DIR!\.htaccess" copy "!BASE_DIR!\.htaccess" "!TEMP_COMPLETE!\"

:: Copy documentation
if exist "!BASE_DIR!\BEGET-DEPLOY-GUIDE.md" copy "!BASE_DIR!\BEGET-DEPLOY-GUIDE.md" "!TEMP_COMPLETE!\documentation\"
if exist "!BASE_DIR!\README.md" copy "!BASE_DIR!\README.md" "!TEMP_COMPLETE!\documentation\"

echo Creating deployment scripts...

:: Master deployment script
(
echo #!/bin/bash
echo # =================================================================
echo # Production CRM - Complete Beget Deployment Script
echo # =================================================================
echo.
echo echo "======================================================================"
echo echo "PRODUCTION CRM - BEGET DEPLOYMENT"
echo echo "======================================================================"
echo.
echo # Check if running as root
echo if [ "$EUID" -eq 0 ]; then
echo   echo "Warning: Running as root. Consider using a non-root user."
echo fi
echo.
echo # Create application directory
echo APP_DIR="/home/$(whoami^)/production-crm"
echo echo "Creating application directory: $APP_DIR"
echo mkdir -p "$APP_DIR"
echo cd "$APP_DIR"
echo.
echo # Copy files
echo echo "Copying application files..."
echo cp -r ./backend/* ./
echo cp -r ./frontend/build ./frontend-build
echo.
echo # Install backend dependencies
echo echo "Installing backend dependencies..."
echo cd "$APP_DIR"
echo npm install --production
echo.
echo # Set up environment
echo echo "Setting up environment..."
echo if [ ! -f .env ]; then
echo   cp .env.beget .env
echo   echo "Please edit .env file with your configuration:"
echo   echo "- Database credentials"
echo   echo "- JWT secret key"
echo   echo "- Domain settings"
echo   echo "- CORS origins"
echo   echo ""
echo   echo "After editing .env, run: ./start-services.sh"
echo else
echo   echo ".env file already exists, skipping copy"
echo fi
echo.
echo echo "Deployment preparation complete!"
echo echo "Next steps:"
echo echo "1. Edit .env file with your settings"
echo echo "2. Run: ./start-services.sh"
echo echo "3. Configure your web server to serve frontend-build/"
) > "!TEMP_COMPLETE!\deploy-scripts\deploy.sh"

:: Service startup script
(
echo #!/bin/bash
echo # =================================================================
echo # Start Production CRM Services
echo # =================================================================
echo.
echo echo "Starting Production CRM services..."
echo.
echo # Check if .env exists
echo if [ ! -f .env ]; then
echo   echo "ERROR: .env file not found!"
echo   echo "Please run deploy.sh first"
echo   exit 1
echo fi
echo.
echo # Start backend
echo echo "Starting backend service..."
echo nohup npm run start:prod ^> backend.log 2^>^&1 ^& 
echo echo $! ^> backend.pid
echo.
echo # Optional: Start frontend with Node.js server
echo if [ -f "frontend/server.js" ]; then
echo   echo "Starting frontend server..."
echo   cd frontend
echo   nohup node server.js ^> ../frontend.log 2^>^&1 ^&
echo   echo $! ^> ../frontend.pid
echo   cd ..
echo fi
echo.
echo echo "Services started!"
echo echo "Backend PID: $(cat backend.pid^)"
echo if [ -f "frontend.pid" ]; then
echo   echo "Frontend PID: $(cat frontend.pid^)"
echo fi
echo.
echo echo "Logs:"
echo echo "- Backend: tail -f backend.log"
echo echo "- Frontend: tail -f frontend.log"
) > "!TEMP_COMPLETE!\deploy-scripts\start-services.sh"

:: Service stop script
(
echo #!/bin/bash
echo # =================================================================
echo # Stop Production CRM Services
echo # =================================================================
echo.
echo echo "Stopping Production CRM services..."
echo.
echo # Stop backend
echo if [ -f "backend.pid" ]; then
echo   echo "Stopping backend..."
echo   kill $(cat backend.pid^) 2^>/dev/null
echo   rm backend.pid
echo fi
echo.
echo # Stop frontend
echo if [ -f "frontend.pid" ]; then
echo   echo "Stopping frontend..."
echo   kill $(cat frontend.pid^) 2^>/dev/null
echo   rm frontend.pid
echo fi
echo.
echo echo "Services stopped!"
) > "!TEMP_COMPLETE!\deploy-scripts\stop-services.sh"

:: Windows deployment script
(
echo @echo off
echo REM =================================================================
echo REM Production CRM - Windows Beget Deployment
echo REM =================================================================
echo.
echo echo Deploying Production CRM on Windows...
echo.
echo REM Create application directory
echo set "APP_DIR=C:\production-crm"
echo if not exist "%%APP_DIR%%" mkdir "%%APP_DIR%%"
echo cd /d "%%APP_DIR%%"
echo.
echo REM Copy files
echo echo Copying application files...
echo xcopy .\backend\* .\ /E /I /Y
echo xcopy .\frontend\build .\frontend-build\ /E /I /Y
echo.
echo REM Install dependencies
echo echo Installing backend dependencies...
echo call npm install --production
echo.
echo REM Set up environment
echo if not exist .env (
echo   copy .env.beget .env
echo   echo Please edit .env file with your configuration
echo   echo Then run: start-services.bat
echo ^) else (
echo   echo .env file already exists
echo ^)
echo.
echo echo Deployment preparation complete!
echo pause
) > "!TEMP_COMPLETE!\deploy-scripts\deploy.bat"

:: Create comprehensive README
(
echo # Production CRM - Complete Beget Deployment Package
echo.
echo This package contains everything needed to deploy Production CRM on Beget hosting.
echo.
echo ## Package Contents
echo.
echo - `backend/` - Complete backend application with dependencies
echo - `frontend/` - Built frontend application ready for deployment
echo - `deploy-scripts/` - Deployment and management scripts
echo - `documentation/` - Complete documentation
echo - `.env.beget` - Environment configuration template
echo.
echo ## Quick Deployment Guide
echo.
echo ### Prerequisites
echo - Node.js 18+ installed on server
echo - PostgreSQL database created
echo - Domain or subdomain configured
echo.
echo ### Deployment Steps
echo.
echo 1. **Upload and Extract**
echo    ```bash
echo    # Upload the ZIP file to your server
echo    unzip production-crm-beget-complete-*.zip
echo    cd production-crm-beget-complete-*/
echo    ```
echo.
echo 2. **Configure Environment**
echo    ```bash
echo    cp .env.beget .env
echo    nano .env  # Edit with your settings
echo    ```
echo.
echo 3. **Deploy Application**
echo    ```bash
echo    chmod +x deploy-scripts/*.sh
echo    ./deploy-scripts/deploy.sh
echo    ```
echo.
echo 4. **Start Services**
echo    ```bash
echo    ./deploy-scripts/start-services.sh
echo    ```
echo.
echo ## Configuration Options
echo.
echo ### Environment Variables (.env^)
echo ```
echo # Database
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=your_database_name
echo DB_USERNAME=your_db_user
echo DB_PASSWORD=your_secure_password
echo.
echo # Security
echo JWT_SECRET=your_very_long_random_secret_key
echo JWT_EXPIRES_IN=7d
echo.
echo # Domain
echo CORS_ORIGIN=https://your-domain.beget.tech
echo REACT_APP_API_URL=https://your-domain.beget.tech/api
echo DOMAIN=your-domain.beget.tech
echo ```
echo.
echo ### Frontend Deployment Options
echo.
echo **Option 1: Static Files (Recommended^)**
echo ```bash
echo # Copy frontend build to web directory
echo cp -r frontend/build/* /path/to/web/directory/
echo cp frontend/.htaccess /path/to/web/directory/
echo ```
echo.
echo **Option 2: Node.js Server**
echo ```bash
echo cd frontend
echo npm install express
echo node server.js
echo ```
echo.
echo **Option 3: Nginx**
echo ```bash
echo # Copy nginx configuration
echo cp frontend/nginx-beget.conf /etc/nginx/sites-available/crm
echo # Enable site and restart nginx
echo ```
echo.
echo ## Management Scripts
echo.
echo - `deploy-scripts/deploy.sh` - Initial deployment
echo - `deploy-scripts/start-services.sh` - Start all services
echo - `deploy-scripts/stop-services.sh` - Stop all services
echo.
echo ## API Endpoints
echo.
echo - Health Check: `GET /health`
echo - API Documentation: `GET /api/docs`
echo - Authentication: `POST /api/auth/login`
echo - Main API: `/api/*`
echo.
echo ## Troubleshooting
echo.
echo ### Common Issues
echo.
echo 1. **Port already in use**
echo    ```bash
echo    # Check what's using the port
echo    netstat -tulnp ^| grep :3001
echo    # Kill the process if needed
echo    kill $(lsof -t -i:3001^)
echo    ```
echo.
echo 2. **Database connection failed**
echo    ```bash
echo    # Test database connection
echo    psql -h localhost -U your_user -d your_database
echo    ```
echo.
echo 3. **Permission denied**
echo    ```bash
echo    # Fix file permissions
echo    chmod +x deploy-scripts/*.sh
echo    chown -R www-data:www-data /path/to/app/
echo    ```
echo.
echo 4. **API not accessible**
echo    - Check if backend is running: `curl http://localhost:3001/health`
echo    - Verify firewall settings
echo    - Check nginx/apache configuration
echo.
echo ## Security Checklist
echo.
echo - [ ] Changed default JWT_SECRET
echo - [ ] Set secure database password
echo - [ ] Configured HTTPS (SSL certificate^)
echo - [ ] Set up firewall rules
echo - [ ] Configured backup strategy
echo - [ ] Set up monitoring/logging
echo.
echo ## File Structure After Deployment
echo ```
echo /home/user/production-crm/
echo ├── dist/                 # Compiled backend code
echo ├── src/                  # Backend source code
echo ├── node_modules/         # Backend dependencies
echo ├── frontend-build/       # Frontend static files
echo ├── uploads/              # File uploads directory
echo ├── .env                  # Environment configuration
echo ├── package.json          # Backend dependencies
echo ├── backend.log           # Backend logs
echo ├── frontend.log          # Frontend logs (if using Node.js^)
echo ├── backend.pid           # Backend process ID
echo └── frontend.pid          # Frontend process ID (if applicable^)
echo ```
echo.
echo ## Support
echo.
echo For deployment issues:
echo 1. Check the logs: `tail -f backend.log`
echo 2. Verify configuration: `cat .env`
echo 3. Test database connection
echo 4. Check service status: `ps aux ^| grep node`
echo.
echo ## Production Optimization
echo.
echo 1. **Enable Gzip Compression**
echo 2. **Set up CDN for static assets**
echo 3. **Configure database connection pooling**
echo 4. **Set up Redis for session storage**
echo 5. **Configure log rotation**
echo 6. **Set up automated backups**
echo.
echo ---
echo.
echo Package created on: !date! !time!
echo Package version: !TIMESTAMP!
) > "!TEMP_COMPLETE!\README-COMPLETE-DEPLOYMENT.md"

echo Creating final ZIP archive...
cd /d "!BASE_DIR!"
powershell -command "Compress-Archive -Path '!TEMP_COMPLETE!\*' -DestinationPath '!BASE_DIR!!COMPLETE_ZIP!' -Force"

if !errorlevel! equ 0 (
    echo SUCCESS: Complete deployment package created!
    echo File: !BASE_DIR!!COMPLETE_ZIP!
    
    :: Get file size
    for %%A in ("!BASE_DIR!!COMPLETE_ZIP!") do set "file_size=%%~zA"
    set /a "file_size_mb=!file_size! / 1024 / 1024"
    echo Size: !file_size_mb! MB
) else (
    echo ERROR: Failed to create complete package
)

echo Cleaning up temporary files...
if exist "!TEMP_COMPLETE!" rmdir /s /q "!TEMP_COMPLETE!"

echo.
echo ====================================================================
echo COMPLETE BEGET DEPLOYMENT PACKAGE READY!
echo ====================================================================
echo.
echo Individual packages:
echo - Backend: backend-beget.zip
echo - Frontend: frontend-beget.zip
echo.
echo Complete package: !COMPLETE_ZIP!
echo.
echo This package contains:
echo ✓ Complete backend with dependencies
echo ✓ Production-ready frontend build
echo ✓ Deployment scripts for Linux and Windows
echo ✓ Configuration templates
echo ✓ Comprehensive documentation
echo ✓ Service management scripts
echo.
echo Next steps:
echo 1. Upload !COMPLETE_ZIP! to your Beget server
echo 2. Extract and run deployment script
echo 3. Configure your environment variables
echo 4. Start the services
echo.
echo SECURITY REMINDER:
echo - Change all default passwords
echo - Set a secure JWT_SECRET
echo - Configure HTTPS/SSL
echo - Set up proper firewall rules
echo.
pause
