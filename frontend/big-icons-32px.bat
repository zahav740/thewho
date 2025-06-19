@echo off
echo ==============================================
echo    МАКСИМАЛЬНО БОЛЬШИЕ ИКОНКИ (32px)
echo ==============================================
echo.

echo 🛑 Останавливаем процессы...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🔥 Очищаем кэш браузера и приложения...
rmdir /s /q node_modules\.cache 2>nul
del /q .eslintcache 2>nul

echo 📦 Устанавливаем зависимости...
call npm install --silent

echo 🎯 НОВЫЕ ИЗМЕНЕНИЯ:
echo    ✅ Иконки увеличены до 32px
echo    ✅ Кнопки размером 50x50px
echo    ✅ Тип кнопок: primary ghost
echo    ✅ Добавлены тени и анимация
echo    ✅ Увеличена высота строк таблицы
echo.

echo 🚀 Запускаем с большими иконками...
echo.
echo 📋 ПОСЛЕ ЗАПУСКА:
echo    1. Откройте http://localhost:5101
echo    2. ОБЯЗАТЕЛЬНО нажмите Ctrl+Shift+R
echo    3. Перейдите в "База данных"
echo    4. Иконки теперь НАМНОГО больше!
echo.

set GENERATE_SOURCEMAP=false
call npm start
