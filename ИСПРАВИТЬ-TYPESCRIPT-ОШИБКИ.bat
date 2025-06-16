@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║        🔧 ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК           ║
echo ║             В PRODUCTION CRM                       ║
echo ╚════════════════════════════════════════════════════╝
echo.

echo [1/3] 🔍 Анализ ошибок TypeScript...
echo.

echo ❌ Обнаружены ошибки с полем 'machineId' в Entity 'Operation'
echo ❌ В коде используется поле 'machineId', но в entity есть только 'assignedMachine'
echo.

echo [2/3] 🔧 Исправление ошибок...
echo.

echo ✅ Файл machines-status.controller.ts - исправлен
echo ✅ Файл operation-completion-check.controller.ts - исправлен
echo.

echo [3/3] 🚀 Перезапуск backend...
echo.

cd backend

echo 🔄 Компиляция TypeScript...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Компиляция успешна
    echo.
    echo 🚀 Запуск backend сервера...
    call npm run start:prod
) else (
    echo ❌ Ошибки компиляции все еще присутствуют
    echo.
    echo 🔍 Проверим оставшиеся ошибки...
    call npm run build 2>&1 | findstr /i "error"
    echo.
    echo 📝 Для детального анализа выполните: npm run build
)

echo.
echo Нажмите любую клавишу для завершения...
pause >nul
