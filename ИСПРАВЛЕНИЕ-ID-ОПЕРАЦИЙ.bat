@echo off
echo ========================================
echo   ИСПРАВЛЕНИЕ ID ОПЕРАЦИЙ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo 🔨 Быстрая проверка TypeScript...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ ЕЩЕ ЕСТЬ ОШИБКИ!
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ ВСЕ ИСПРАВЛЕНО!
    echo.
    echo 🎯 Основные исправления:
    echo    ✅ CreateOperationDto - убрана деструктуризация id
    echo    ✅ UpdateOperationDto - тип id изменен на number  
    echo    ✅ TypeORM совместимость - восстановлена
    echo.
    echo 🚀 Запускаем Backend...
    
    call npm run build
    if errorlevel 1 (
        echo ❌ Ошибка сборки!
        pause
        exit /b 1
    )
    
    echo.
    echo 🌐 Backend будет доступен на:
    echo    ✅ API:     http://localhost:5100/api
    echo    ✅ Swagger: http://localhost:5100/api/docs
    echo    ✅ Health:  http://localhost:5100/api/health
    echo.
    
    call npm run start:dev
)

pause
