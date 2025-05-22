@echo off
echo 🔧 Исправление проблемы с английской версией приложения...

REM Переходим в директорию приложения
cd /d "%~dp0"

echo 📁 Текущая директория: %CD%

REM 1. Создаем HTML файл для очистки localStorage
echo 🧹 Создание файла для очистки localStorage...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<title^>Clear LocalStorage^</title^>
echo ^</head^>
echo ^<body^>
echo     ^<script^>
echo         localStorage.clear^(^);
echo         localStorage.setItem^('language', 'en'^);
echo         console.log^('LocalStorage очищен, установлен английский язык'^);
echo         document.body.innerHTML = '^<h1^>LocalStorage очищен!^</h1^>^<p^>Английский язык установлен по умолчанию.^</p^>^<p^>Теперь можно запустить приложение.^</p^>';
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > clear-localstorage.html

REM 2. Проверяем зависимости
echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠️  Зависимости не установлены. Устанавливаем...
    npm install
) else (
    echo ✅ Зависимости уже установлены
)

REM 3. Создаем резервную копию
echo 💾 Создание резервной копии i18n...
copy "src\i18n\index.ts" "src\i18n\index.ts.backup" >nul

REM 4. Применяем исправленную конфигурацию
echo 🔧 Применение исправленной конфигурации i18n...
copy "src\i18n\index-debug.ts" "src\i18n\index.ts" >nul

echo.
echo ✅ Готово! Инструкции по запуску:
echo.
echo 1. Откройте clear-localstorage.html в браузере
echo 2. Запустите в терминале: npm run dev
echo 3. Откройте http://localhost:5173
echo.
echo 📝 Для автоматического запуска введите: start clear-localstorage.html && npm run dev
echo.
pause
