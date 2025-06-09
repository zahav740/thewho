@echo off
chcp 65001
echo.
echo ===============================================
echo 🚀 ПЕРЕЗАПУСК BACKEND С МОДУЛЕМ ОПЕРАТОРОВ
echo ===============================================
echo.

echo ✅ База данных готова:
echo   - Таблица operators создана
echo   - Операторы добавлены: Denis, Andrey, Daniel, Slava, Kirill, Аркадий
echo.

echo 🔧 Исправления:
echo   - API настроен на порт 5100
echo   - Модуль OperatorsModule подключен
echo   - TypeScript ошибки исправлены
echo.

echo 🚀 Перезапускаем Backend на порту 5100...
echo.

cd backend
echo Останавливаем процессы на портах 5100 и 5101...
taskkill /f /im node.exe >nul 2>&1

echo Ждем 3 секунды...
timeout /t 3 /nobreak >nul

echo Запускаем Backend...
set PORT=5100
npm run start:prod

pause
