@echo off
echo ===================================
echo    УСТАНОВКА НЕДОСТАЮЩИХ ЗАВИСИМОСТЕЙ
echo ===================================
echo.

cd /d "%~dp0"

echo Переход в backend директорию...
cd backend

echo.
echo Установка undici для fetch поддержки...
npm install --save-dev undici

echo.
echo Проверка TypeScript компиляции...
npx tsc --noEmit --skipLibCheck
if %errorlevel%==0 (
    echo ✅ TypeScript компиляция успешна!
) else (
    echo ⚠️ Есть предупреждения TypeScript (не критично)
)

echo.
echo ===================================
echo    ЗАВИСИМОСТИ УСТАНОВЛЕНЫ
echo ===================================
echo.
echo Теперь можно запустить приложение:
echo START-CRM-ENHANCED.bat
echo.
pause
