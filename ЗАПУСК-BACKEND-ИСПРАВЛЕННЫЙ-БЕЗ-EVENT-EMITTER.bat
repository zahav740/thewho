@echo off
echo 🚀 ЗАПУСК BACKEND БЕЗ EVENT EMITTER (ИСПРАВЛЕНО)
echo.
echo 📋 Что исправлено:
echo   ✓ Убраны импорты @nestjs/event-emitter
echo   ✓ Отключены EventEmitter в SynchronizationService  
echo   ✓ Отключены события в ShiftsService
echo   ✓ Система синхронизации работает без событий
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Устанавливаем зависимости...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка установки зависимостей!
    pause
    exit /b 1
)

echo.
echo 🔧 Компилируем TypeScript...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка компиляции TypeScript!
    echo.
    echo 💡 Проверьте ошибки выше и исправьте их.
    pause
    exit /b 1
)

echo.
echo ✅ Компиляция успешна!
echo.
echo 🚀 Запускаем backend на порту 3001...
echo.

call npm run start:dev

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка запуска backend!
    pause
    exit /b 1
)

pause
