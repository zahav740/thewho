@echo off
chcp 65001 > nul
echo.
echo 🔧 ФИНАЛЬНАЯ ПРОВЕРКА И ЗАПУСК CRM СИСТЕМЫ
echo =======================================
echo.

cd /d "%~dp0"

echo 📋 ВЫПОЛНЕННЫЕ ИСПРАВЛЕНИЯ:
echo ✅ 1. Исправлены импорты типов Express
echo ✅ 2. Добавлено свойство stream в MulterFile  
echo ✅ 3. Исправлена типизация Request/Response
echo ✅ 4. Колонка K приоритетна над J в Excel импорте
echo ✅ 5. Порты настроены: Backend 5100, Frontend 5101
echo.

echo 🔍 Проверяем компиляцию TypeScript...
cd backend
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo ✅ TypeScript компиляция успешна!
    echo.
    echo 🚀 Запускаем систему...
    
    cd ..
    
    echo 📂 Запуск Backend на порту 5100...
    start "CRM Backend (5100)" cmd /c "cd backend && npx ts-node --transpile-only src/main.ts"
    
    echo ⏳ Ждем 5 секунд для запуска backend...
    timeout /t 5 /nobreak > nul
    
    echo 📂 Запуск Frontend на порту 5101...
    start "CRM Frontend (5101)" cmd /c "cd frontend && npm run start"
    
    echo.
    echo ✅ СИСТЕМА ЗАПУЩЕНА УСПЕШНО!
    echo.
    echo 🌐 URL-адреса:
    echo   Frontend: http://localhost:5101
    echo   Backend API: http://localhost:5100/api  
    echo   Swagger docs: http://localhost:5100/api/docs
    echo.
    echo 📋 Для тестирования Excel импорта:
    echo   1. Откройте http://localhost:5101
    echo   2. Перейдите в "Заказы"
    echo   3. Нажмите "Excel импорт"
    echo   4. Загрузите файл с данными в колонке K
    echo.
    
) else (
    echo ❌ Есть ошибки TypeScript! Проверьте лог выше.
    echo.
    echo 🔧 Попробуйте запустить:
    echo   ИСПРАВИТЬ-TYPESCRIPT-ОШИБКИ.bat
    echo.
)

echo.
pause
