@echo off
echo ==============================================
echo    ПЕРЕЗАПУСК FRONTEND С ОБНОВЛЕННЫМИ ПЕРЕВОДАМИ
echo ==============================================
echo.

echo 🔄 Останавливаем frontend процессы...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 📦 Проверяем зависимости...
call npm install --silent

echo 🌐 Запускаем frontend с переводами...
echo.
echo ✅ Frontend запускается на http://localhost:5101
echo 📝 Проверьте модальное окно "Запись смены" - теперь с переводами!
echo.

call npm start
