@echo off
echo ==============================================
echo    ИСПРАВЛЕНИЕ BACKEND DTO V2 И ПЕРЕЗАПУСК
echo ==============================================

cd /d "%~dp0\backend"

echo.
echo 🔧 Останавливаем текущий процесс backend...
taskkill /f /im node.exe 2>nul

echo.
echo 🔄 Очищаем кеш TypeScript...
if exist "dist" rmdir /s /q dist

echo.
echo 📦 Перекомпилируем backend с новыми DTO...
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Не удалось скомпилировать backend
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Backend успешно скомпилирован с новыми V2 DTO!

echo.
echo 🚀 Запускаем backend в режиме разработки...
start "CRM Backend V2 Fixed" npm run start:dev

echo.
echo ✅ Backend запущен с исправлениями V2 DTO!
echo.
echo 📋 Что было исправлено:
echo    ✓ Создан CreateOrderV2Dto с PriorityV2 enum (строки)
echo    ✓ Создан UpdateOrderV2Dto для обновления заказов
echo    ✓ Добавлена конвертация строковых приоритетов в числовые
echo    ✓ Обновлен контроллер V2 для использования новых DTO
echo.
echo 🌐 Backend доступен на: http://localhost:5100
echo 📖 API документация: http://localhost:5100/api
echo.
pause
