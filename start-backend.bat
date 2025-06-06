@echo off
echo Starting Production CRM Backend...
cd backend
call npm install
call npm run start:migrate:dev
pause
