@echo off
echo 📦 УСТАНОВКА @nestjs/event-emitter ДЛЯ СИНХРОНИЗАЦИИ
echo.
echo 📋 Что будет установлено:
echo   ✓ @nestjs/event-emitter - для системы событий
echo   ✓ Восстановление полной функциональности синхронизации
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Устанавливаем @nestjs/event-emitter...
call npm install @nestjs/event-emitter

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ПАКЕТ УСПЕШНО УСТАНОВЛЕН!
    echo.
    echo 🔄 Теперь можно раскомментировать код:
    echo   • synchronization.module.ts - убрать комментарии с EventEmitterModule
    echo   • synchronization.service.ts - убрать комментарии с EventEmitter2
    echo   • shifts.service.ts - убрать комментарии с событиями
    echo.
    echo 🚀 После этого запускайте backend обычным способом:
    echo    npm run start:dev
    echo.
) else (
    echo.
    echo ❌ Ошибка установки пакета!
    echo 💡 Проверьте подключение к интернету и права доступа.
    echo.
)

pause
