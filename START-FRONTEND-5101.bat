@echo off
title CRM FRONTEND - ПОРТ 5101
color 0B

echo ==========================================
echo ЗАПУСК FRONTEND НА ПОРТУ 5101
echo ==========================================
echo.

cd frontend

echo 🔍 Проверяем зависимости...
if not exist node_modules (
    echo 📦 Устанавливаем зависимости...
    npm install
)

echo.
echo 🚀 Запускаем frontend на порту 5101...
echo.
echo Frontend доступен на: http://localhost:5101
echo.

set PORT=5101
npm run start

pause
