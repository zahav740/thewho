@echo off
chcp 65001 > nul
echo ===========================================
echo 🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ TYPESCRIPT
echo ===========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📂 Текущая директория: %CD%
echo.

echo 🔧 Проверка TypeScript компиляции...
echo.

npx tsc --noEmit --skipLibCheck

if %errorlevel% equ 0 (
    echo.
    echo ✅ TypeScript ошибки исправлены!
    echo 🎉 Файл переводов успешно исправлен
    echo.
    echo 📋 Исправления:
    echo    - Удалены дублирующиеся ключи 'shifts.day' и 'shifts.night'
    echo    - Структура файла переводов восстановлена
    echo    - Все ключи переводов уникальны
    echo.
) else (
    echo.
    echo ❌ Обнаружены ошибки TypeScript
    echo 🔍 Проверьте вывод выше для деталей
    echo.
)

echo.
echo Нажмите любую клавишу для выхода...
pause > nul
