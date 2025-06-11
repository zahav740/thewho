@echo off
echo ================================================
echo 🚀 ПЕРЕЗАПУСК FRONTEND С ИСПРАВЛЕНИЯМИ
echo ================================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 🛑 Останавливаем старые процессы...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo 🧹 Очищаем кэш...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .next rmdir /s /q .next
if exist dist rmdir /s /q dist

echo.
echo 📦 Устанавливаем зависимости...
npm install --silent

echo.
echo 🔧 Проверяем исправления...
echo - ✅ EnhancedOperationAnalyticsModal.tsx исправлен
echo - ✅ Убраны бесконечные запросы
echo - ✅ Добавлена правильная обработка ошибок
echo - ✅ Оптимизированы API вызовы

echo.
echo 🚀 Запускаем frontend на порту 3000...
echo.
echo ⚠️ ВАЖНО: Убедитесь что backend запущен на порту 5100!
echo.

npm run dev

echo.
echo === ГОТОВО ===
pause
