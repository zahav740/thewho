@echo off
echo ===========================================
echo ИСПРАВЛЕНИЕ ТИПОВ EXPRESS - ПЕРЕУСТАНОВКА
echo ===========================================

cd backend

echo 🔧 Переустанавливаем типы Express...

echo Удаляем старые типы...
npm uninstall @types/express

echo Очищаем кэш npm...
npm cache clean --force

echo Устанавливаем свежие типы Express...
npm install --save-dev @types/express@^4.17.21

echo.
echo 📊 Проверяем установку...
npm list @types/express

echo.
echo 🔍 Проверяем TypeScript компиляцию...
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ТИПЫ EXPRESS ИСПРАВЛЕНЫ!
    echo ✅ TypeScript компилируется успешно
    echo.
) else (
    echo.
    echo ❌ Проблема все еще есть. Используем альтернативный метод...
    echo.
    goto :alternative_fix
)

pause
exit /b 0

:alternative_fix
echo.
echo 🔧 АЛЬТЕРНАТИВНОЕ ИСПРАВЛЕНИЕ: Используем @nestjs/platform-express типы
echo.

echo Заменяем импорты на NestJS совместимые...
