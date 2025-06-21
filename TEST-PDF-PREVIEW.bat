@echo off
echo ========================================
echo       ТЕСТ PDF ПРЕВЬЮ СИСТЕМЫ
echo ========================================
echo.

echo 📁 Создание тестовых PDF файлов...
node create-test-pdf.js
echo.

echo 🔍 Проверка существующих PDF файлов...
node test-pdf-access.js
echo.

echo 📋 Инструкции для тестирования:
echo.
echo 1. Убедитесь, что backend запущен:
echo    cd backend
echo    npm run start:dev
echo.
echo 2. Убедитесь, что frontend запущен:
echo    cd frontend  
echo    npm start
echo.
echo 3. Откройте в браузере:
echo    http://localhost:3000
echo.
echo 4. Протестируйте прямой доступ к PDF:
echo    http://localhost:5100/api/orders/pdf/test-pdf-document.pdf
echo    http://localhost:5100/api/orders/pdf/1750498636129-413393729.pdf
echo.
echo 5. Откройте форму заказа и протестируйте загрузку PDF
echo.

echo ✅ Готово! Все файлы созданы.
pause
