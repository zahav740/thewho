@echo off
echo =============================================
echo     БЫСТРОЕ ИСПРАВЛЕНИЕ PDF PREVIEW
echo =============================================
echo.

echo 🔧 Шаг 1: Исправляем расположение PDF файла...
node fix-pdf-location.js

echo.
echo 🔧 Шаг 2: Запускаем диагностику backend...
node debug-pdf-backend.js

echo.
echo 🔧 Шаг 3: Инструкции для проверки...
echo.
echo 📋 ДАЛЬНЕЙШИЕ ДЕЙСТВИЯ:
echo.
echo 1. Если backend недоступен:
echo    cd backend
echo    npm run start
echo.
echo 2. Если backend работает, но файл не найден:
echo    - Проверьте что файл существует в uploads/pdf/
echo    - Перезапустите backend
echo.
echo 3. Если все работает в backend, проверьте frontend:
echo    - Откройте http://localhost:3000
echo    - Откройте заказ с PDF
echo    - Проверьте консоль браузера на ошибки
echo.
echo 4. Прямая ссылка для тестирования:
echo    http://localhost:5100/api/orders/pdf/1750497060623-385439311.pdf
echo.
pause
