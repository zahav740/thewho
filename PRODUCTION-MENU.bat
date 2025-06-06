@echo off
REM ====================================
REM   Production CRM - One-Click Deploy
REM ====================================

title Production CRM Deployment

echo.
echo  ██████╗ ██████╗ ███╗   ███╗    ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗
echo ██╔════╝██╔══██╗████╗ ████║    ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝
echo ██║     ██████╔╝██╔████╔██║    ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ 
echo ██║     ██╔══██╗██║╚██╔╝██║    ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  
echo ╚██████╗██║  ██║██║ ╚═╝ ██║    ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   
echo  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝    ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   
echo.
echo                           Production Deployment System
echo                              Version 1.0 - 2025
echo.

:menu
echo ============================================
echo   Choose an action:
echo ============================================
echo.
echo   1. Check readiness for deployment
echo   2. Deploy system to production
echo   3. System monitoring
echo   4. Stop system
echo   5. Restart system
echo   6. Full cleanup (delete all data)
echo   7. Create database backup
echo   8. Show logs
echo   9. Help
echo   0. Exit
echo.
set /p choice=Enter number: 

if "%choice%"=="1" goto check_readiness
if "%choice%"=="2" goto deploy
if "%choice%"=="3" goto monitor
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto cleanup
if "%choice%"=="7" goto backup
if "%choice%"=="8" goto logs
if "%choice%"=="9" goto help
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
pause
cls
goto menu

:check_readiness
cls
echo Checking deployment readiness...
call check-readiness.bat
pause
cls
goto menu

:deploy
cls
echo Deploying system...
call deploy.bat
pause
cls
goto menu

:monitor
cls
echo Starting monitoring...
call monitor.bat
pause
cls
goto menu

:stop
cls
echo Stopping system...
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
echo System stopped successfully
pause
cls
goto menu

:restart
cls
echo Restarting system...
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart
echo System restarted successfully
pause
cls
goto menu

:cleanup
cls
echo WARNING! This action will delete ALL data!
set /p confirm=Are you sure? (yes/no): 
if /i not "%confirm%"=="yes" (
    echo Cancelled
    pause
    cls
    goto menu
)
echo Performing full cleanup...
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --volumes --rmi all --remove-orphans
docker system prune -a -f
echo System completely cleaned
pause
cls
goto menu

:backup
cls
echo Creating database backup...
set backup_name=backup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set backup_name=%backup_name: =0%
docker exec production_crm_db pg_dump -U postgres production_crm > %backup_name%.sql
if %errorlevel% equ 0 (
    echo Backup created: %backup_name%.sql
) else (
    echo Backup creation error
)
pause
cls
goto menu

:logs
cls
echo System logs:
echo.
echo Choose service:
echo 1. All services
echo 2. Backend
echo 3. Frontend  
echo 4. Database
echo.
set /p log_choice=Enter number: 

if "%log_choice%"=="1" (
    docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=50
) else if "%log_choice%"=="2" (
    docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=50 backend
) else if "%log_choice%"=="3" (
    docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=50 frontend
) else if "%log_choice%"=="4" (
    docker-compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=50 postgres
) else (
    echo Invalid choice
)
pause
cls
goto menu

:help
cls
echo System Help
echo ===========
echo.
echo Addresses after deployment:
echo    • Frontend: http://localhost
echo    • Backend API: http://localhost:3000/api
echo    • Swagger: http://localhost:3000/api/docs
echo.
echo Important files:
echo    • docker-compose.prod.yml - Docker configuration
echo    • .env.prod - environment variables
echo    • PRODUCTION-DEPLOYMENT.md - detailed documentation
echo.
echo Docker commands:
echo    • docker-compose ps - container status
echo    • docker-compose logs -f - view logs
echo    • docker-compose restart - restart
echo.
echo Tips:
echo    • Create regular database backups
echo    • Monitor disk space usage
echo    • Check logs for errors
echo.
pause
cls
goto menu

:exit
cls
echo Goodbye!
echo Thank you for using Production CRM System!
timeout /t 2 /nobreak >nul
exit

