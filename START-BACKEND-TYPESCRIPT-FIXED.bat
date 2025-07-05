@echo off
title CRM BACKEND - ИСПРАВЛЕННАЯ ВЕРСИЯ
color 0A

echo ===========================================
echo ЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ TYPESCRIPT
echo ===========================================
echo.

cd backend

echo 🔍 Проверяем зависимости...
if not exist node_modules (
    echo 📦 Устанавливаем зависимости...
    npm install
)

echo.
echo 📊 Проверяем TypeScript...
npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибки TypeScript! Проверьте код.
    pause
    exit /b 1
)

echo ✅ TypeScript OK!
echo.

echo 🚀 Запускаем backend на порту 5100...
echo.
echo Backend доступен на: http://localhost:5100
echo API Docs: http://localhost:5100/api/docs
echo.

set PORT=5100
npm run start:dev

pause
