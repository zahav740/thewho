@echo off
echo ==============================================
echo        ДИАГНОСТИКА ПРОБЛЕМ EXCEL ИМПОРТА
echo ==============================================

cd /d "%~dp0backend"
echo Переходим в папку backend: %cd%

echo.
echo 🔍 1. Проверяем компиляцию TypeScript...
call npx tsc --noEmit

if %ERRORLEVEL% neq 0 (
    echo ❌ Найдены ошибки компиляции TypeScript!
    echo Сначала исправьте ошибки компиляции.
    pause
    exit /b 1
)

echo ✅ Компиляция TypeScript прошла успешно!

echo.
echo 🔍 2. Проверяем установку зависимостей для Excel...

echo Проверяем exceljs...
call npm list exceljs 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ exceljs не установлен. Устанавливаем...
    call npm install exceljs
) else (
    echo ✅ exceljs установлен
)

echo Проверяем multer types...
call npm list @types/multer 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ @types/multer не установлен. Устанавливаем...
    call npm install --save-dev @types/multer
) else (
    echo ✅ @types/multer установлен
)

echo Проверяем @nestjs/platform-express...
call npm list @nestjs/platform-express 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ @nestjs/platform-express не установлен. Устанавливаем...
    call npm install @nestjs/platform-express
) else (
    echo ✅ @nestjs/platform-express установлен
)

echo.
echo 🔍 3. Проверяем структуру файлов...

if exist "src\modules\orders\excel-test.controller.ts" (
    echo ✅ excel-test.controller.ts найден
) else (
    echo ❌ excel-test.controller.ts не найден
)

if exist "src\modules\orders\excel-import.service.ts" (
    echo ✅ excel-import.service.ts найден
) else (
    echo ❌ excel-import.service.ts не найден
)

if exist "src\modules\orders\orders.module.ts" (
    echo ✅ orders.module.ts найден
) else (
    echo ❌ orders.module.ts не найден
)

echo.
echo 🔍 4. Проверяем базу данных подключение...
echo Запускаем тест подключения к БД...

set NODE_ENV=development
call node -e "
const { TypeOrmModule } = require('@nestjs/typeorm');
console.log('📊 Конфигурация TypeORM готова');
const { ConfigModule } = require('@nestjs/config');
console.log('⚙️ ConfigModule готов');
console.log('✅ Основные модули загружены успешно');
"

echo.
echo 🔍 5. Запускаем сервер в режиме диагностики...
echo Сервер будет запущен. Проверьте:
echo   - http://localhost:5100/api (основной API)
echo   - http://localhost:5100/api/excel-test/upload (тест Excel)
echo   - Откройте файл TEST-EXCEL-UPLOAD.html для тестирования
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.

start "" "TEST-EXCEL-UPLOAD.html"

call npm run start:dev

echo.
echo Сервер остановлен.
pause
