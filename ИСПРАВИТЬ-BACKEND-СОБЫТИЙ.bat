@echo off
echo 🔧 ИСПРАВЛЕНИЕ ОШИБОК BACKEND - УСТАНОВКА @nestjs/event-emitter
echo.
echo 📦 Что будет сделано:
echo   ✓ Установка пакета @nestjs/event-emitter
echo   ✓ Очистка кэша npm
echo   ✓ Запуск backend на порту 5100
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Устанавливаем недостающий пакет...
npm install @nestjs/event-emitter

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка при установке пакета!
    echo 💡 Попробуем альтернативный способ...
    npm install --save @nestjs/event-emitter
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Установка не удалась!
        echo 🔧 Попробуйте вручную:
        echo    cd backend
        echo    npm install @nestjs/event-emitter
        pause
        exit /b 1
    )
)

echo ✅ Пакет @nestjs/event-emitter установлен успешно!
echo.
echo 🧹 Очищаем кэш...
npm run build 2>nul

echo.
echo 🚀 Запускаем backend на порту 5100...
set NODE_ENV=production
set PORT=5100
npm run start

echo.
pause
