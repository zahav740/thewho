@echo off
echo 🔧 Диагностика PDF функциональности в Production CRM
echo =====================================================
echo.

echo 📋 Проверка структуры проекта...
if not exist "backend" (
    echo ❌ Папка backend не найдена
    goto :error
)

if not exist "frontend" (
    echo ❌ Папка frontend не найдена
    goto :error
)

echo ✅ Структура проекта корректна
echo.

echo 🔍 Тестирование backend PDF функциональности...
node test-pdf-backend-detailed.js

echo.
echo 📁 Проверка PDF файлов...
if exist "backend\uploads\pdf\*.pdf" (
    echo ✅ PDF файлы найдены в backend\uploads\pdf:
    dir /b "backend\uploads\pdf\*.pdf"
) else if exist "uploads\pdf\*.pdf" (
    echo ✅ PDF файлы найдены в uploads\pdf:
    dir /b "uploads\pdf\*.pdf"
) else (
    echo ⚠️ PDF файлы не найдены
)

echo.
echo 🌐 URL для тестирования в браузере:
echo   http://localhost:5100/api/orders/pdf/test-pdf-document.pdf
echo   http://localhost:5100/api/health
echo   http://localhost:5100/api/docs

echo.
echo 💡 Рекомендации:
echo   1. Убедитесь, что backend запущен: cd backend && npm run start:dev
echo   2. Убедитесь, что frontend запущен: cd frontend && npm start
echo   3. Откройте приложение: http://localhost:3000
echo   4. Перейдите в База данных -> Заказы -> Редактировать заказ
echo   5. Проверьте вкладку "PDF Документация"

goto :end

:error
echo.
echo ❌ Ошибка: Неправильная структура проекта
echo 💡 Убедитесь, что вы находитесь в корневой папке production-crm

:end
echo.
echo 🏁 Диагностика завершена
pause
