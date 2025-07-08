@echo off
echo === Проверка исправленных OrderForm файлов ===

cd /d "C:\Users\Alexey\Downloads\thewho-main\frontend"
echo Текущая директория: %cd%

echo.
echo Проверка OrderForm.PDF.tsx...
npx tsc --noEmit src/pages/Database/components/OrderForm.PDF.tsx

echo.
echo Проверка OrderForm.SIMPLE.tsx...
npx tsc --noEmit src/pages/Database/components/OrderForm.SIMPLE.tsx

echo.
echo === Проверка завершена ===
pause
