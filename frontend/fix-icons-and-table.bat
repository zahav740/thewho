@echo off
echo ==============================================
echo    ИСПРАВЛЕНИЕ ТАБЛИЦЫ И УВЕЛИЧЕНИЕ ИКОНОК
echo ==============================================
echo.

echo 🛑 Останавливаем все процессы...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 >nul

echo 🧹 Очищаем все кэши...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .next 2>nul
del /q .eslintcache 2>nul

echo 📦 Переустанавливаем зависимости...
call npm install --silent

echo 🎨 Компилируем с новыми стилями...
echo.
echo ✅ Frontend запускается на http://localhost:5101
echo 🔧 ИСПРАВЛЕНИЯ:
echo    - Иконки увеличены до 24px
echo    - Добавлен CSS для анимации
echo    - Исправлена таблица
echo    - Кнопки теперь type="text"
echo.
echo 📋 После запуска:
echo    1. Откройте http://localhost:5101
echo    2. Нажмите Ctrl+Shift+R для принудительной перезагрузки
echo    3. Перейдите в "База данных"
echo    4. Проверьте большие иконки в колонке "Действия"
echo.

set GENERATE_SOURCEMAP=false
set BROWSER=none
call npm start
