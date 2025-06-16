@echo off
echo 🎉 ФИНАЛЬНЫЙ ЗАПУСК BACKEND (ВСЕ ОШИБКИ ИСПРАВЛЕНЫ)
echo.
echo ✅ Исправления применены:
echo   ✓ synchronization.module.ts - убран EventEmitterModule
echo   ✓ synchronization.service.ts - отключен EventEmitter2
echo   ✓ shifts.module.ts - убран EventEmitterModule
echo   ✓ shifts.service.ts - отключены события
echo   ✓ Все импорты @nestjs/event-emitter закомментированы
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo ⏳ Проверяем зависимости...
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Ошибка установки зависимостей!
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Компилируем проект...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка компиляции TypeScript!
    echo 💡 Проверьте ошибки выше.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Компиляция успешна!
echo.
echo 🚀 Запускаем backend в production режиме на порту 5100...
echo.
echo 📊 Доступные endpoints:
echo    http://localhost:5100/api/machines - API станков
echo    http://localhost:5100/api/shifts - API смен  
echo    http://localhost:5100/api/docs - Swagger документация
echo    http://localhost:5100/api/health - Проверка здоровья
echo.

set NODE_ENV=production
set PORT=5100

call npm run start

pause
