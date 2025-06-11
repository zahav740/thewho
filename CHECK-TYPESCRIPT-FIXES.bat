@echo off
echo ================================================
echo 🔧 ПРОВЕРКА ИСПРАВЛЕНИЙ TYPESCRIPT ОШИБОК
echo ================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 📝 Проверяем TypeScript компиляцию...
echo Команда: npx tsc --noEmit --skipLibCheck

npx tsc --noEmit --skipLibCheck

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ TYPESCRIPT ОШИБКИ ИСПРАВЛЕНЫ!
    echo.
    echo 📋 Список исправлений:
    echo - ✅ Заменено cacheTime на gcTime для новых версий react-query
    echo - ✅ Добавлена типизация (as any) для analyticsData
    echo - ✅ Переименована переменная analytics на analyticsInfo 
    echo - ✅ Упрощена логика обработки данных
    echo - ✅ Убраны сложные интерфейсы
    echo.
    echo 🚀 Готово к запуску!
    echo.
    echo Для запуска frontend выполните:
    echo npm run dev
    echo.
) ELSE (
    echo.
    echo ❌ Всё ещё есть ошибки TypeScript.
    echo Проверьте вывод выше для деталей.
    echo.
)

echo.
echo === ГОТОВО ===
pause
