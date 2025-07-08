@echo off
title LAYOUT FIX - RESTART FRONTEND
cd /d "%~dp0"

echo.
echo =====================================
echo   ИСПРАВЛЕНИЕ LAYOUT - ПЕРЕЗАПУСК
echo =====================================
echo.

echo 🛑 1. Останавливаем frontend...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5101" 2^>nul') do (
    taskkill /f /pid %%a 2>nul >nul
)

echo 🧹 2. Очищаем кэш браузера...
echo    ВАЖНО: Нажмите Ctrl+Shift+R в браузере после запуска!

echo ⚙️ 3. Устанавливаем переменные...
set NODE_ENV=development
set REACT_APP_API_URL=http://localhost:5100/api
set PORT=5101
set BROWSER=none

echo 🚀 4. Запускаем frontend с исправлениями layout...
echo.
echo 📋 Исправления:
echo    ✅ Убран position: fixed из Sider
echo    ✅ Убран marginLeft из Layout
echo    ✅ Убран position: sticky из Header
echo    ✅ Добавлены CSS правила для Layout
echo.

npm start

pause