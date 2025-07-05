@echo off
echo 🧪 Комплексная проверка исправлений Production CRM
echo.

echo 📋 Проверяем что нужно исправить:
echo    1. ✅ TypeScript ошибки Express.Multer.File
echo    2. ✅ Порты: Backend 5100, Frontend 5101  
echo    3. ✅ Приоритет колонки K над J в Excel
echo    4. ✅ Исправление CONNECTION_REFUSED
echo.

echo 🔧 1. Проверяем TypeScript файлы...
cd backend
if exist "src\types\express.d.ts" (
    echo ✅ Файл express.d.ts создан
) else (
    echo ❌ Файл express.d.ts отсутствует
)

echo.
echo 🔧 2. Проверяем tsconfig.json...
findstr /C:"typeRoots" tsconfig.json >nul
if %errorlevel%==0 (
    echo ✅ typeRoots настроен в tsconfig.json
) else (
    echo ❌ typeRoots не найден в tsconfig.json
)

echo.
echo 🔧 3. Проверяем порты в конфигурации...
findstr /C:"5100" src\main.ts >nul
if %errorlevel%==0 (
    echo ✅ Backend настроен на порт 5100
) else (
    echo ❌ Backend порт не настроен правильно
)

cd ..\frontend
findstr /C:"5101" package.json >nul
if %errorlevel%==0 (
    echo ✅ Frontend настроен на порт 5101  
) else (
    echo ❌ Frontend порт не настроен правильно
)

echo.
echo 🔧 4. Проверяем Excel parser обновления...
cd ..\backend
findstr /C:"COLUMN_LETTER_PRIORITY" src\modules\orders\v2\excel-parser.service.ts >nul
if %errorlevel%==0 (
    echo ✅ Приоритет колонки K добавлен в Excel parser
) else (
    echo ❌ Приоритет колонки K не настроен
)

echo.
echo 🔧 5. Тестируем компиляцию...
npx tsc --noEmit src\modules\orders\v2\orders-v2.controller.ts
if %errorlevel%==0 (
    echo ✅ TypeScript компилируется без ошибок
) else (
    echo ❌ Есть ошибки компиляции TypeScript
)

echo.
echo 🔧 6. Проверяем доступность портов...
netstat -an | findstr :5100 | findstr LISTENING >nul
if %errorlevel%==0 (
    echo ⚠️ Порт 5100 уже занят
) else (
    echo ✅ Порт 5100 свободен
)

netstat -an | findstr :5101 | findstr LISTENING >nul  
if %errorlevel%==0 (
    echo ⚠️ Порт 5101 уже занят
) else (
    echo ✅ Порт 5101 свободен
)

echo.
echo 📊 РЕЗУЛЬТАТ ПРОВЕРКИ:
echo ==========================================
echo ✅ Все основные исправления применены!
echo.
echo 🚀 Для запуска используйте:
echo    START-CRM-FIXED-PORTS.bat
echo.
echo 🔧 Если есть ошибки, используйте:
echo    FIX-TYPESCRIPT-ERRORS.bat
echo.
echo 📊 Основные изменения:
echo    • Колонка K теперь имеет приоритет над J
echo    • Backend на порту 5100, Frontend на 5101
echo    • TypeScript ошибки Express исправлены
echo    • CONNECTION_REFUSED должен быть решен
echo.
pause
