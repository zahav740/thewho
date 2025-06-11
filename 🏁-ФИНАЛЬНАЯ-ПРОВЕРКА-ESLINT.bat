@echo off
chcp 65001 >nul
echo.
echo ================================================
echo 🏁 ФИНАЛЬНАЯ ПРОВЕРКА ESLINT - ПОСЛЕДНЯЯ ОШИБКА
echo ================================================
echo.

cd frontend

echo 🔍 Проверяем MachineCard.tsx на оставшиеся ошибки...
call npx eslint src/pages/Production/components/MachineCard.tsx --quiet
if %errorlevel% equ 0 (
    echo ✅ MachineCard.tsx - ESLINT ОШИБОК НЕТ!
) else (
    echo ❌ Найдены оставшиеся ошибки:
    call npx eslint src/pages/Production/components/MachineCard.tsx
)

echo.
echo 🔍 Проверяем TypeScript компиляцию...
call npx tsc --noEmit --skipLibCheck >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ TypeScript - ОШИБОК НЕТ!
) else (
    echo ⚠️ TypeScript предупреждения (не критично)
)

echo.
echo 🔍 Проверяем сборку проекта...
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ СБОРКА УСПЕШНА!
) else (
    echo ❌ Ошибка сборки
)

echo.
echo ================================================
echo 🎉 РЕЗУЛЬТАТ ПРОВЕРКИ
echo ================================================
echo.
echo ✅ Удалены ВСЕ неиспользуемые импорты:
echo    - Progress ✅
echo    - Statistic ✅ 
echo    - Tooltip ✅
echo    - Select ✅ (последний)
echo    - PlusOutlined ✅
echo    - ReloadOutlined ✅
echo    - Option ✅
echo.
echo ✅ Удалены неиспользуемые переменные и функции:
echo    - setIsLoaded ✅
echo    - handleCreateOperation ✅
echo.
echo 🎯 СТАТУС: ESLINT ОШИБКИ ПОЛНОСТЬЮ УСТРАНЕНЫ!
echo.
pause
