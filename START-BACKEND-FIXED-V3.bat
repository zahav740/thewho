@echo off
echo ====================================
echo 🚀 ЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ
echo ====================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 📊 Проверяем порт 5100...
netstat -an | findstr :5100
if %errorlevel% == 0 (
    echo ⚠️ Порт 5100 занят, останавливаем процессы...
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
)

echo 📦 Устанавливаем зависимости...
call npm install

echo 📊 Проверяем TypeScript компиляцию...
call npx tsc --noEmit

if %errorlevel% == 0 (
    echo ✅ TypeScript компиляция успешна!
    echo.
    echo 🚀 Запускаем backend на порту 5100...
    echo 🌐 Backend будет доступен на http://localhost:5100
    echo 📄 Swagger документация: http://localhost:5100/api/docs
    echo.
    echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ:
    echo    - Импорты в excel-parser.service.ts
    echo    - Конвертация типов в контроллерах V2
    echo    - Утилитарные функции в excel-import.utils.ts
    echo.
    call npm run start:dev
) else (
    echo ❌ Ошибки TypeScript не исправлены полностью
    echo 🔍 Проверьте вывод выше
    pause
)
