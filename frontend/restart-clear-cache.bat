@echo off
echo ==============================================
echo    ПЕРЕЗАПУСК FRONTEND С УВЕЛИЧЕННЫМИ ИКОНКАМИ
echo ==============================================
echo.

echo 🔄 Останавливаем все процессы Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul

echo 🧹 Очищаем кэш React...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .next 2>nul

echo 📦 Устанавливаем зависимости...
call npm install --silent

echo 🎨 Запускаем с принудительной перезагрузкой стилей...
echo.
echo ✅ Frontend запускается на http://localhost:5101
echo 📝 Обновите страницу с Ctrl+F5 для сброса кэша браузера!
echo 🖱️ Проверьте иконки карандаша и мусорки в разделе "База данных"
echo.

set GENERATE_SOURCEMAP=false
call npm start
