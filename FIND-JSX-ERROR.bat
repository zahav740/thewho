@echo off
echo ========================================
echo ПОИСК JSX ОШИБКИ В ФАЙЛЕ ПЛАНИРОВАНИЯ
echo ========================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend\src\pages\Planning"

echo.
echo Ищем некорректные закрывающие теги...
echo.

findstr /N "</r>" ProductionPlanningPage.tsx
findstr /N "</r>" ProductionPlanningPage.tsx

echo.
echo ========================================
echo Если найдены строки выше, проверьте их!
echo ========================================
pause
