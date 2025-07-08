@echo off
echo === Проверка TypeScript компиляции Frontend ===

cd /d "C:\Users\Alexey\Downloads\thewho-main\frontend"
echo Текущая директория: %cd%

echo Запуск TypeScript компилятора...
npx tsc --noEmit

if %errorlevel% equ 0 (
    echo ✅ TypeScript компиляция успешна!
) else (
    echo ❌ Найдены ошибки в TypeScript
)

pause
