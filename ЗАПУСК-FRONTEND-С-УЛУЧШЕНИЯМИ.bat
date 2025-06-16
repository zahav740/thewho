@echo off
echo ===========================================
echo    ЗАПУСК FRONTEND С НОВЫМИ КОМПОНЕНТАМИ
echo ===========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo Проверяем TypeScript ошибки...
call npx tsc --noEmit

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  Есть TypeScript ошибки, но пытаемся запустить...
    echo.
)

echo Запускаем frontend сервер...
echo.
echo 🚀 Frontend будет доступен по адресу: http://localhost:3000
echo 📱 Новые компоненты:
echo    - OperationCompletionModal (модальное окно завершения)
echo    - useOperationCompletion (хук управления)
echo    - Улучшенный ActiveMachinesMonitor
echo    - Расширенный MachineCard с кнопкой проверки
echo.

call npm start

pause
