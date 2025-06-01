@echo off
chcp 65001 >nul
echo ====================================
echo    FINAL TYPESCRIPT FIX & TEST
echo ====================================
echo.

echo [INFO] Переход в директорию backend...
cd /d "C:\Users\apule\Downloads\TheWho\production-crm\backend"

if not exist "package.json" (
    echo [ERROR] Backend directory not found!
    pause
    exit /b 1
)

echo [INFO] Проверяем установленные зависимости...
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Некоторые зависимости не установились, продолжаем...
)

echo.
echo [INFO] Запускаем TypeScript компиляцию (без генерации файлов)...
call npx tsc --noEmit --skipLibCheck
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Обнаружены TypeScript ошибки, но продолжаем...
    echo [INFO] Проверяем конкретные файлы orders.service...
) else (
    echo [SUCCESS] TypeScript компиляция прошла успешно!
)

echo.
echo [INFO] Проверяем конкретно файлы orders service...
call npx tsc --noEmit --skipLibCheck src/modules/orders/orders.service.ts
call npx tsc --noEmit --skipLibCheck src/modules/orders/orders.service.fixed.ts

echo.
echo [INFO] Запускаем backend в режиме разработки...
echo [INFO] Проверим, что сервер стартует без ошибок...

timeout /t 2 /nobreak >nul
call npm run start:dev

echo.
pause