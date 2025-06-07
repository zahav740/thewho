@echo off
echo ================================================
echo ЭКСПОРТ ЗАКАЗОВ В ФАЙЛОВУЮ СИСТЕМУ
echo ================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo 📁 Проверяем структуру папок...
if not exist "uploads\orders" (
    echo Создаем папку uploads\orders...
    mkdir "uploads\orders"
)

echo.
echo 📊 Текущее состояние файловой системы:
if exist "uploads\orders" (
    for /d %%d in ("uploads\orders\*") do (
        echo   📦 Заказ: %%~nxd
        for /d %%v in ("%%d\*") do (
            echo     📅 Версия: %%~nxv
        )
    )
) else (
    echo   📂 Папка orders не существует
)

echo.
echo 🚀 Запускаем экспорт через Node.js скрипт...
echo.

:: Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js
    pause
    exit /b 1
)

:: Запускаем экспорт
node export-orders-to-filesystem.js export

echo.
echo 📊 Проверяем результат:
if exist "uploads\orders" (
    for /d %%d in ("uploads\orders\*") do (
        echo   📦 Заказ: %%~nxd
        for /d %%v in ("%%d\*") do (
            echo     📅 Версия: %%~nxv
            if exist "%%v\order.json" echo       ✅ order.json
            if exist "%%v\operations\operations.json" echo       ✅ operations.json
            if exist "%%v\metadata.json" echo       ✅ metadata.json
        )
    )
)

echo.
echo ✅ Экспорт завершен!
pause
