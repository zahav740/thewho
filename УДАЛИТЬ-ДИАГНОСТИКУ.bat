@echo off
chcp 65001 >nul
echo ========================================
echo 🧹 УДАЛЕНИЕ ДИАГНОСТИЧЕСКИХ КОМПОНЕНТОВ
echo ========================================
echo.

echo После проверки работы модального окна:
echo.

echo 1️⃣ Удалите диагностический компонент:
echo    del "frontend\src\components\OperatorsApiDiagnostics.tsx"
echo.

echo 2️⃣ Удалите импорт из ShiftForm.tsx:
echo    Откройте: frontend\src\pages\Shifts\components\ShiftForm.tsx
echo    Удалите строку: import OperatorsApiDiagnostics from '../../../components/OperatorsApiDiagnostics';
echo    Удалите строку: ^<OperatorsApiDiagnostics /^>
echo.

echo 3️⃣ Или автоматическое удаление:
echo.
set /p answer="Удалить диагностические компоненты автоматически? (y/n): "
if /i "%answer%"=="y" (
    echo Удаляем диагностический компонент...
    del "frontend\src\components\OperatorsApiDiagnostics.tsx" 2>nul && echo ✅ Файл удален || echo ❌ Файл не найден
    
    echo.
    echo ℹ️ Теперь вручную удалите из ShiftForm.tsx:
    echo    - import OperatorsApiDiagnostics from '../../../components/OperatorsApiDiagnostics';
    echo    - ^<OperatorsApiDiagnostics /^>
    echo.
    echo ✅ Очистка завершена!
) else (
    echo ℹ️ Удаление отменено. Компоненты остались для дальнейшей диагностики.
)
echo.

pause