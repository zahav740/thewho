@echo off
echo 🔧 Исправление TypeScript ошибок завершено!
echo.
echo 📋 Что было исправлено:
echo ✅ Заменен импорт xlsx на exceljs
echo ✅ Исправлена обработка дат для PostgreSQL  
echo ✅ Переписана функция экспорта Excel
echo.
echo 🚀 Сейчас нужно:
echo 1️⃣ Установить типы ExcelJS
echo 2️⃣ Перезапустить сервер разработки
echo.

echo ⏳ Устанавливаем типы ExcelJS...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
call npm install --save-dev @types/exceljs

if %ERRORLEVEL% EQU 0 (
    echo ✅ Типы ExcelJS установлены успешно!
    echo.
    echo 🔄 Перезапускаем сервер разработки...
    call npm run start:dev
) else (
    echo ❌ Ошибка при установке типов ExcelJS
    echo 💡 Попробуйте вручную: npm install --save-dev @types/exceljs
    pause
)
