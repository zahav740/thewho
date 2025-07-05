@echo off
echo ====================================
echo   БЫСТРАЯ ПРОВЕРКА ТИПОВ - ORDERS V2
echo ====================================
echo.

cd /d "%~dp0frontend"
echo Проверка типов в Orders V2...

echo.
echo [1/4] Проверка OrdersPage...
npx tsc --noEmit src/pages/Orders/OrdersPage.tsx
if %errorlevel% neq 0 (
    echo ❌ Ошибки в OrdersPage
    pause
    exit /b 1
)

echo.
echo [2/4] Проверка OrdersList...
npx tsc --noEmit src/pages/Orders/components/OrdersList.tsx
if %errorlevel% neq 0 (
    echo ❌ Ошибки в OrdersList
    pause
    exit /b 1
)

echo.
echo [3/4] Проверка ExcelImportModal...
npx tsc --noEmit src/pages/Orders/components/ExcelImportModal.tsx
if %errorlevel% neq 0 (
    echo ❌ Ошибки в ExcelImportModal
    pause
    exit /b 1
)

echo.
echo [4/4] Проверка OrderForm...
npx tsc --noEmit src/pages/Orders/components/OrderForm.tsx
if %errorlevel% neq 0 (
    echo ❌ Ошибки в OrderForm
    pause
    exit /b 1
)

echo.
echo ✅ Все файлы Orders V2 проверены успешно!
echo.
pause
