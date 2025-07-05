@echo off
echo ====================================
echo ПЕРЕЗАПУСК BACKEND С EXCEL IMPORT
echo ====================================

echo.
echo [1/4] Останавливаем текущие процессы...
taskkill /F /IM node.exe 2>nul
timeout /t 2

echo.
echo [2/4] Очищаем кэш и пересобираем...
cd backend
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache
npm run build
echo ✅ Пересборка завершена

echo.
echo [3/4] Проверяем конфигурацию...
echo Проверяем TypeORM entities...
findstr /S /I "ExcelImportDbController" src\modules\orders\orders.module.ts
if %errorlevel% equ 0 (
    echo ✅ ExcelImportDbController найден в модуле
) else (
    echo ❌ ExcelImportDbController НЕ найден в модуле
)

echo.
echo [4/4] Запускаем backend...
echo 🚀 Backend запускается на порту 5100...
npm run start:dev

pause
