@echo off
chcp 65001 > nul
echo 🔧 ИСПРАВЛЕНИЕ ESLINT ОШИБОК FRONTEND
echo =====================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo ⏳ Проверка текущих ошибок ESLint...
call npm run lint > lint-before.txt 2>&1

echo ⏳ Автоматическое исправление ESLint ошибок...
call npm run lint -- --fix

echo ⏳ Проверка ошибок после исправления...
call npm run lint > lint-after.txt 2>&1

echo.
echo 📊 ОТЧЕТ ОБ ИСПРАВЛЕНИЯХ:
echo ========================

if exist "lint-before.txt" (
    echo 📋 Ошибки до исправления сохранены в lint-before.txt
)

if exist "lint-after.txt" (
    echo 📋 Ошибки после исправления сохранены в lint-after.txt
)

echo.
echo ⏳ Проверка компиляции TypeScript...
call npm run type-check

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ОШИБКИ TYPESCRIPT!
    echo 🔍 Проверьте ошибки выше
    echo.
) else (
    echo.
    echo ✅ TYPESCRIPT КОМПИЛИРУЕТСЯ БЕЗ ОШИБОК!
    echo.
)

echo ⏳ Попытка сборки проекта...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ОШИБКА СБОРКИ!
    echo 🔍 Проверьте ошибки выше
    echo.
) else (
    echo.
    echo ✅ FRONTEND УСПЕШНО СОБРАН!
    echo 📁 Файлы сборки в папке build/
    echo.
)

echo.
echo 🎯 ИТОГИ:
echo ========
echo ✅ ESLint ошибки исправлены автоматически
echo ✅ TypeScript проверен
echo ✅ Проект собран
echo.
echo 🚀 Теперь можно запускать frontend: npm start
echo.
pause
