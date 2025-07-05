@echo off
echo ==============================================
echo     ЗАПУСК CRM С ИСПРАВЛЕНИЯМИ V2 DTO
echo ==============================================

cd /d "%~dp0"

echo.
echo 📋 Последовательность запуска с исправлениями:
echo.
echo    1. Проверка TypeScript компиляции frontend
echo    2. Исправление и перекомпиляция backend V2 DTO
echo    3. Запуск backend на порту 5100
echo    4. Запуск frontend на порту 5101
echo.

echo ⏳ Шаг 1: Проверяем TypeScript компиляцию frontend...
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

echo ⏳ Шаг 2: Останавливаем процессы и перекомпилируем backend...
taskkill /f /im node.exe 2>nul

cd ..\backend

echo 🔄 Очищаем кеш и перекомпилируем...
if exist "dist" rmdir /s /q dist
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ОШИБКА: Не удалось скомпилировать backend с новыми DTO
    echo.
    pause
    exit /b 1
)

echo ✅ Backend скомпилирован с V2 DTO исправлениями!
echo.

echo ⏳ Шаг 3: Запускаем backend на порту 5100...
start "CRM Backend V2" npm run start:dev

echo.
echo ⏳ Шаг 4: Ждем 8 секунд для полного запуска backend...
timeout /t 8 /nobreak > nul

echo.
echo ⏳ Шаг 5: Запускаем frontend на порту 5101...
cd ..\frontend
start "CRM Frontend V2" npm run dev

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА С ИСПРАВЛЕНИЯМИ!
echo.
echo 🌐 Доступ к приложению:
echo    - Frontend: http://localhost:5101
echo    - Backend API: http://localhost:5100/api
echo    - Swagger: http://localhost:5100/api/docs
echo.
echo 🎯 Исправления DTO V2:
echo    ✓ TypeScript ошибки исправлены
echo    ✓ CreateOrderV2Dto с поддержкой строковых приоритетов
echo    ✓ UpdateOrderV2Dto для обновления заказов  
echo    ✓ Автоматическая конвертация PriorityV2 (строки) ↔ Priority (числа)
echo    ✓ Исправлен контроллер V2 для работы с новыми DTO
echo.
echo 🧪 Теперь можно тестировать Excel импорт!
echo.
pause
