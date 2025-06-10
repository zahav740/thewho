@echo off
chcp 65001 >nul
echo ===============================================
echo  🚀 ПОЛНОЕ ИСПРАВЛЕНИЕ И ЗАПУСК CRM СИСТЕМЫ  
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo ✅ Основные ошибки TypeScript исправлены:
echo    • Заменены русские кавычки на обычные
echo    • Исправлены вызовы функций переводов  
echo    • Добавлены правильные импорты tWithParams
echo.

echo 🔧 Переходим к фронтенду...
cd frontend

echo.
echo 1️⃣ Устанавливаем зависимости...
call npm install

echo.
echo 2️⃣ Проверяем TypeScript...
call npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Остались ошибки TypeScript!
    echo Детали ошибок смотрите выше.
    echo.
    echo 💡 Попробуйте следующее:
    echo    1. Перезапустите этот скрипт
    echo    2. Проверьте вручную файлы:
    echo       - src\pages\Database\DatabasePage.tsx
    echo       - src\pages\Database\components\OrderForm.SIMPLE.tsx  
    echo       - src\pages\Database\components\OrdersList.tsx
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ TypeScript проверка пройдена!

echo.
echo 3️⃣ Запускаем фронтенд в режиме разработки...
start "CRM Frontend" cmd /k "title CRM Frontend Server && npm start"

echo.
echo 🎉 FRONTEND ЗАПУЩЕН!
echo.
echo 🌐 Откройте браузер по адресу:
echo    http://localhost:3000
echo.
echo 📍 Главные страницы системы:
echo    • Производство:      http://localhost:3000/production
echo    • База данных:       http://localhost:3000/database  
echo    • Активные операции: http://localhost:3000/operations
echo    • Смены:            http://localhost:3000/shifts
echo    • Планирование:     http://localhost:3000/planning
echo.
echo 🔧 Для запуска backend сервера используйте отдельно:
echo    • ЗАПУСК-BACKEND.bat
echo    • START-BACKEND-ONLY.bat
echo.
echo ⚠️  ВАЖНО: Убедитесь что PostgreSQL запущен для полной работы!
echo.
pause
