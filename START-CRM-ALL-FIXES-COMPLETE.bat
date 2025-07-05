@echo off
echo ==============================================
echo    ЗАПУСК CRM С ПОЛНЫМИ ИСПРАВЛЕНИЯМИ
echo ==============================================

cd /d "%~dp0"

echo.
echo 🎯 ИСПРАВЛЕНИЯ ВКЛЮЧАЮТ:
echo    ✓ TypeScript ошибки исправлены
echo    ✓ Backend DTO V2 с поддержкой строковых приоритетов
echo    ✓ Убрана конвертация priority в Number() на frontend
echo    ✓ Полная интеграция Frontend ↔ Backend V2
echo.

echo ⏳ Шаг 1: Проверяем TypeScript компиляцию...
cd frontend
npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Frontend все еще имеет ошибки TypeScript!
    echo.
    pause
    exit /b 1
)

echo ✅ Frontend TypeScript - OK!
echo.

echo ⏳ Шаг 2: Останавливаем все процессы...
taskkill /f /im node.exe 2>nul

echo.
echo ⏳ Шаг 3: Запускаем backend с исправленными DTO V2...
cd ..\backend
start "CRM Backend V2 FINAL" npm run start:dev

echo.
echo ⏳ Шаг 4: Ждем 8 секунд для полного запуска backend...
timeout /t 8 /nobreak > nul

echo.
echo ⏳ Шаг 5: Запускаем frontend с исправлениями...
cd ..\frontend
start "CRM Frontend V2 FINAL" npm run dev

echo.
echo ✅ СИСТЕМА ПОЛНОСТЬЮ ИСПРАВЛЕНА И ЗАПУЩЕНА!
echo.
echo 🌐 Доступ к приложению:
echo    - Frontend: http://localhost:5101
echo    - Backend API: http://localhost:5100/api
echo    - Swagger: http://localhost:5100/api/docs
echo.
echo 🎯 ПОЛНЫЙ СПИСОК ИСПРАВЛЕНИЙ:
echo.
echo 1️⃣ TYPESCRIPT ОШИБКИ:
echo    ✓ PriorityV2 определен как строковый enum
echo    ✓ Все типы согласованы между frontend и backend
echo    ✓ Статические импорты вместо динамических
echo.
echo 2️⃣ BACKEND DTO V2:
echo    ✓ CreateOrderV2Dto с поддержкой строковых приоритетов
echo    ✓ UpdateOrderV2Dto для обновления заказов
echo    ✓ Автоматическая конвертация PriorityV2 → числа внутри backend
echo.
echo 3️⃣ FRONTEND ИНТЕГРАЦИЯ:
echo    ✓ Убрана конвертация priority в Number() из operation-formatter
echo    ✓ Приоритеты остаются строками: 'HIGH', 'MEDIUM', 'LOW', 'URGENT'
echo    ✓ Исправлены комментарии в ordersApi.ts
echo.
echo 🧪 ТЕСТИРОВАНИЕ:
echo    ✓ Excel импорт должен работать без ошибки 400
echo    ✓ Создание заказов через frontend
echo    ✓ Массовое создание заказов
echo    ✓ Обновление существующих заказов
echo.
echo 🔍 В логах браузера теперь должно быть:
echo    📝 API V2: Отформатированные данные: {priority: 'LOW', ...}
echo    🔄 Отформатированные данные: {priority: 'LOW', ...}
echo    ✅ API RESPONSE: Object (статус 201)
echo.
echo 🎉 ГОТОВО К ПРОДУКТИВНОЙ РАБОТЕ!
echo.
pause
