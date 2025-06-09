@echo off
echo ====================================
echo ПРОВЕРКА КОМПИЛЯЦИИ BACKEND
echo ====================================

cd /d "%~dp0\backend"

echo [1/2] Проверяем TypeScript компиляцию...
echo.

npx tsc --noEmit
if %errorlevel% == 0 (
    echo ✅ TypeScript компиляция прошла успешно!
    echo.
    echo [2/2] Запускаем backend...
    echo.
    echo 🔧 Исправления применены:
    echo   ✅ Добавлены импорты diskStorage и extname
    echo   ✅ Исправлен метод upload-excel (работает с buffer)
    echo   ✅ Улучшен метод upload-pdf (с логированием)
    echo   ✅ Убраны тестовые данные из Excel импорта
    echo.
    
    start "📡 Backend (TypeScript Fixed)" cmd /k "title Backend TS Fixed && echo BACKEND STARTING WITH TYPESCRIPT FIXES... && npm run start:dev"
    
    echo ✅ Backend запускается без ошибок TypeScript!
) else (
    echo ❌ Ошибки TypeScript! Проверьте код.
    echo.
    echo Возможные проблемы:
    echo - Отсутствующие импорты
    echo - Ошибки типов
    echo - Синтаксические ошибки
)

echo ====================================
pause
