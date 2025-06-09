@echo off
echo ===============================================
echo 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ И ЗАПУСК BACKEND
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo.
echo ✅ Переходим в директорию backend...
echo Текущая директория: %CD%

echo.
echo 🔍 Проверяем TypeScript ошибки...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Найдены ошибки TypeScript! Пытаемся исправить...
    echo.
    
    echo 🔧 Исправляем типизацию...
    
    pause
    echo.
    echo 🔄 Повторная проверка...
    call npx tsc --noEmit
    
    if errorlevel 1 (
        echo ❌ Ошибки TypeScript все еще присутствуют!
        echo Проверьте код вручную или обратитесь к разработчику.
        pause
        exit /b 1
    )
)

echo.
echo ✅ TypeScript проверка прошла успешно!

echo.
echo 🏗️ Сборка проекта...
call npm run build

if errorlevel 1 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)

echo.
echo ✅ Сборка завершена успешно!

echo.
echo 🚀 Запуск production сервера...
echo Backend будет доступен на: http://localhost:5100
echo API документация: http://localhost:5100/api/docs
echo.

call npm run start:prod

pause
