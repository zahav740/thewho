@echo off
echo ===============================================
echo  ДИАГНОСТИКА ОШИБОК TYPESCRIPT
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo Проверяем основные файлы с ошибками...
echo.

echo === DatabasePage.tsx ===
if exist "src\pages\Database\DatabasePage.tsx" (
    echo ✅ Файл существует
    findstr /n "className.*\"" "src\pages\Database\DatabasePage.tsx" | findstr /v "className=\"" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ❌ Найдены русские кавычки в className
    ) else (
        echo ✅ Русские кавычки исправлены
    )
) else (
    echo ❌ Файл не найден
)

echo.
echo === OrderForm.SIMPLE.tsx ===
if exist "src\pages\Database\components\OrderForm.SIMPLE.tsx" (
    echo ✅ Файл существует
    findstr /n "type.*\"" "src\pages\Database\components\OrderForm.SIMPLE.tsx" | findstr /v "type=\"" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ❌ Найдены русские кавычки в type
    ) else (
        echo ✅ Русские кавычки исправлены
    )
) else (
    echo ❌ Файл не найден
)

echo.
echo === OrdersList.tsx ===
if exist "src\pages\Database\components\OrdersList.tsx" (
    echo ✅ Файл существует
    findstr /n "direction.*\"" "src\pages\Database\components\OrdersList.tsx" | findstr /v "direction=\"" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ❌ Найдены русские кавычки в direction
    ) else (
        echo ✅ Русские кавычки исправлены
    )
) else (
    echo ❌ Файл не найден
)

echo.
echo Запускаем полную проверку TypeScript...
call npx tsc --noEmit

echo.
echo ===============================================
echo  ДИАГНОСТИКА ЗАВЕРШЕНА
echo ===============================================
pause
