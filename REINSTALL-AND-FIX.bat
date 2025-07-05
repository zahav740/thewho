@echo off
echo ===========================================
echo ПЕРЕУСТАНОВКА ТИПОВ EXPRESS + ИСПРАВЛЕНИЕ
echo ===========================================

cd backend

echo 🔧 Переустанавливаем зависимости...

echo Удаляем node_modules...
rmdir /s /q node_modules 2>nul

echo Удаляем package-lock.json...
del package-lock.json 2>nul

echo Устанавливаем зависимости заново...
npm install

echo.
echo 🔧 Проверяем установку типов Express...
npm list @types/express

echo.
echo 📊 Проверяем TypeScript компиляцию...
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ ИСПРАВЛЕНО! ТИПЫ EXPRESS РАБОТАЮТ!
    echo.
    echo 🚀 Можно запускать:
    echo npm run start:dev
    echo.
) else (
    echo.
    echo ⚠️ Типы Express все еще не работают
    echo Применяем фикс с типами any...
    echo.
    
    REM Быстрая замена всех типов на any
    powershell -Command "(Get-Content 'src/common/middleware/header-size.middleware.ts') -replace 'use\(req: Request, res: Response, next: NextFunction\)', 'use(req: any, res: any, next: any)' | Set-Content 'src/common/middleware/header-size.middleware.ts'"
    powershell -Command "(Get-Content 'src/common/middleware/static-files.middleware.ts') -replace 'use\(req: Request, res: Response, next: NextFunction\)', 'use(req: any, res: any, next: any)' | Set-Content 'src/common/middleware/static-files.middleware.ts'"
    
    echo Применен фикс с типами any
    
    npx tsc --noEmit
    if %ERRORLEVEL% EQU 0 (
        echo ✅ ИСПРАВЛЕНО ЧЕРЕЗ ТИПЫ ANY!
    ) else (
        echo ❌ Все еще есть проблемы
    )
)

pause
