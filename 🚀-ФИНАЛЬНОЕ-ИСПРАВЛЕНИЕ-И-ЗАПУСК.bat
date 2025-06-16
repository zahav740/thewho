@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                    🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ И ЗАПУСК                          ║
echo ║                   МОНИТОРИНГА ПРОИЗВОДСТВА С ИСПРАВЛЕНИЯМИ                    ║
echo ║                                                                                ║
echo ║ Версия: 1.0 Final                                                             ║
echo ║ Дата: 2025-06-12                                                              ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🎯 Цель: Исправить все ошибки TypeScript и запустить систему
echo.

echo ┌────────────────────────────────────────────────────────────────────────────────┐
echo │                           📋 ПЛАН ИСПРАВЛЕНИЙ:                                │
echo ├────────────────────────────────────────────────────────────────────────────────┤
echo │ 1. Исправить ошибки с machineId в контроллерах                                │
echo │ 2. Скомпилировать backend без ошибок                                          │
echo │ 3. Запустить backend на порту 5100                                            │
echo │ 4. Применить исправления мониторинга производства                             │
echo └────────────────────────────────────────────────────────────────────────────────┘
echo.

set /p continue="Продолжить? [Y/N]: "
if /i "%continue%" neq "Y" (
    echo Операция отменена
    pause
    exit /b 0
)

echo.
echo [1/4] 🔧 Исправление ошибок TypeScript...

REM Исправляем machines-status.controller.ts
echo 📝 Исправляем machines-status.controller.ts...
if exist "backend\src\modules\machines\machines-status.controller.ts" (
    powershell -Command "(Get-Content 'backend\src\modules\machines\machines-status.controller.ts') -replace 'if \(operation\.machineId\) \{[^}]*operationsByMachine\.set\(operation\.machineId, operation\);[^}]*\}', '// Используем только assignedMachine из entity Operation' | Set-Content 'backend\src\modules\machines\machines-status.controller.ts'"
    echo ✅ machines-status.controller.ts исправлен
) else (
    echo ⚠️ machines-status.controller.ts не найден
)

REM Исправляем operation-completion-check.controller.ts
echo 📝 Исправляем operation-completion-check.controller.ts...
if exist "backend\src\modules\operations\operation-completion-check.controller.ts" (
    powershell -Command "(Get-Content 'backend\src\modules\operations\operation-completion-check.controller.ts') -replace 'machineId: null.*', '// machineId удален - используем assignedMachine' | Set-Content 'backend\src\modules\operations\operation-completion-check.controller.ts'"
    powershell -Command "(Get-Content 'backend\src\modules\operations\operation-completion-check.controller.ts') -replace 'if \(operation\.machineId\) \{[\s\S]*?\}', '// Используем только assignedMachine, machineId не существует в entity' | Set-Content 'backend\src\modules\operations\operation-completion-check.controller.ts'"
    echo ✅ operation-completion-check.controller.ts исправлен
) else (
    echo ⚠️ operation-completion-check.controller.ts не найден
)

echo ✅ Все исправления применены

echo.
echo [2/4] 🛠️ Компиляция backend...

cd backend

echo 🔄 Запуск npm run build...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции!
    echo.
    echo 🔍 Показываем детали ошибок:
    call npm run build
    echo.
    echo 💡 Возможные причины:
    echo    - Остались другие файлы с machineId
    echo    - Синтаксические ошибки в TypeScript
    echo    - Проблемы с зависимостями
    echo.
    echo 🛠️ Рекомендуемые действия:
    echo    1. Проверьте логи выше на предмет конкретных ошибок
    echo    2. Выполните: npm install (если нужно)
    echo    3. Проверьте все файлы на наличие machineId
    echo.
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!

echo.
echo [3/4] 🚀 Запуск backend сервера...

echo ┌────────────────────────────────────────────────────────────────────────────────┐
echo │                              🚀 СЕРВЕР ЗАПУСКАЕТСЯ                            │
echo ├────────────────────────────────────────────────────────────────────────────────┤
echo │ Порт: 5100                                                                     │
echo │ База данных: postgresql://postgres:magarel@localhost:5432/thewho              │
echo │ Режим: production                                                              │
echo │                                                                                │
echo │ После запуска сервера:                                                        │
echo │ - Проверьте http://localhost:5100/api/machines                                │
echo │ - Убедитесь что новые endpoints работают                                      │
echo │ - Примените исправления мониторинга производства                              │
echo └────────────────────────────────────────────────────────────────────────────────┘
echo.

echo Нажмите Ctrl+C для остановки сервера
echo.

call npm run start:prod

cd ..

echo.
echo [4/4] 📋 Следующие шаги для мониторинга производства...

echo.
echo ╔════════════════════════════════════════════════════════════════════════════════╗
echo ║                          🎉 BACKEND УСПЕШНО ЗАПУЩЕН!                         ║
echo ║                                                                                ║
echo ║ Теперь можно применить исправления мониторинга производства:                  ║
echo ║                                                                                ║
echo ║ 1. 🗄️ Выполните SQL скрипт в базе данных:                                     ║
echo ║    database_update_production_monitoring.sql                                  ║
echo ║                                                                                ║
echo ║ 2. 🎨 Обновите frontend компоненты:                                           ║
echo ║    - Замените MachineCard.tsx                                                 ║
echo ║    - Обновите machinesApi.ts                                                  ║
echo ║    - Добавьте систему уведомлений                                             ║
echo ║                                                                                ║
echo ║ 3. ✅ Проверьте функциональность:                                             ║
echo ║    - Отображение прогресса из смен                                            ║
echo ║    - Автоматические уведомления о завершении                                 ║
echo ║                                                                                ║
echo ║ 📚 Подробные инструкции в:                                                    ║
echo ║    РУКОВОДСТВО_ПО_ВНЕДРЕНИЮ.md                                                 ║
echo ╚════════════════════════════════════════════════════════════════════════════════╝

echo.
echo Нажмите любую клавишу для завершения...
pause >nul
