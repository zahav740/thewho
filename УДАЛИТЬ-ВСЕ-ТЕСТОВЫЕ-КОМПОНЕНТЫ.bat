@echo off
chcp 65001 >nul
echo ========================================
echo 🧹 ОЧИСТКА ТЕСТОВЫХ КОМПОНЕНТОВ (ПРОДАКШЕН)
echo ========================================
echo.

echo 💡 Удаляем все тестовые компоненты для продакшен версии:
echo    - ShiftsDataTest.tsx
echo    - OperatorsApiDiagnostics.tsx (из модального окна)
echo    - Любые другие диагностические компоненты
echo.

set /p answer="Удалить все тестовые компоненты? (y/n): "
if /i not "%answer%"=="y" (
    echo ❌ Операция отменена.
    pause
    exit /b
)

echo.
echo 🗑️ Удаляем тестовые файлы...

if exist "frontend\src\pages\Shifts\components\ShiftsDataTest.tsx" (
    del "frontend\src\pages\Shifts\components\ShiftsDataTest.tsx"
    echo ✅ ShiftsDataTest.tsx удален
) else (
    echo ⚠️ ShiftsDataTest.tsx не найден
)

if exist "frontend\src\components\OperatorsApiDiagnostics.tsx" (
    del "frontend\src\components\OperatorsApiDiagnostics.tsx"
    echo ✅ OperatorsApiDiagnostics.tsx удален
) else (
    echo ⚠️ OperatorsApiDiagnostics.tsx не найден
)

if exist "frontend\src\components\CacheClearButton.tsx" (
    del "frontend\src\components\CacheClearButton.tsx"
    echo ✅ CacheClearButton.tsx удален
) else (
    echo ⚠️ CacheClearButton.tsx не найден
)

echo.
echo 📝 Теперь нужно удалить импорты из ShiftForm.tsx:
echo    Откройте: frontend\src\pages\Shifts\components\ShiftForm.tsx
echo    Удалите строки:
echo    - import OperatorsApiDiagnostics from '../../../components/OperatorsApiDiagnostics';
echo    - ^<OperatorsApiDiagnostics /^>
echo.

echo ✅ Тестовые компоненты удалены!
echo 🎯 Система теперь работает только с реальными данными из БД

pause