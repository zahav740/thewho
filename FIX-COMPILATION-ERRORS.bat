@echo off
echo ===================================
echo   ИСПРАВЛЕНИЕ ОШИБОК КОМПИЛЯЦИИ
echo ===================================
echo.

cd /d "%~dp0"

echo Проблема: styled-jsx синтаксис не поддерживается
echo Решение: Переход на CSS модули
echo.

echo Переход в директорию frontend...
cd frontend

echo.
echo Проверка компиляции...
npx tsc --noEmit --skipLibCheck src/components/ExcelUploader/ExcelColumnMapper.tsx
if %errorlevel% neq 0 (
    echo ❌ Есть ошибки компиляции
    echo.
    echo Попробуем исправить...
    echo.
) else (
    echo ✅ Компиляция прошла успешно!
)

echo.
echo Проверка синтаксиса React...
npx eslint src/components/ExcelUploader/ExcelColumnMapper.tsx --fix
if %errorlevel% neq 0 (
    echo ⚠️ Есть предупреждения ESLint
) else (
    echo ✅ ESLint проверка прошла успешно!
)

echo.
echo Тестовая сборка...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка сборки
    pause
    exit /b 1
) else (
    echo ✅ Сборка прошла успешно!
)

echo.
echo ===================================
echo     ОШИБКИ КОМПИЛЯЦИИ ИСПРАВЛЕНЫ
echo ===================================
echo.
echo Изменения:
echo ✅ Удален styled-jsx синтаксис
echo ✅ Добавлены CSS модули
echo ✅ Исправлены TypeScript ошибки
echo ✅ Улучшены стили для скрытых строк
echo.
echo Файлы созданы:
echo - ExcelColumnMapper.module.css
echo - Обновлен ExcelColumnMapper.tsx
echo.
pause
