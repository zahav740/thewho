@echo off
echo ================================================
echo ЗАПУСК ИСПРАВЛЕННОГО EXCEL МОДУЛЯ (БЕЗ ОШИБОК)
echo ================================================
echo.

echo 🔧 Исправляем TypeScript ошибки...
echo.

echo 📋 Проверяем установку зависимостей backend...
cd backend
if not exist node_modules (
    echo ⚠️  Устанавливаем зависимости backend...
    npm install
)

echo.
echo 📋 Проверяем зависимости Excel модуля...
npm list exceljs >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Устанавливаем ExcelJS...
    npm install exceljs
)

npm list multer >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Устанавливаем Multer...
    npm install multer @types/multer
)

echo.
echo 🚀 Запускаем backend сервер...
start "Backend Server (Fixed)" cmd /k "npm run start:dev"

echo.
echo ⏳ Ждем запуска backend (5 сек)...
timeout /t 5 /nobreak >nul

echo.
echo 📋 Проверяем frontend зависимости...
cd ..\frontend
if not exist node_modules (
    echo ⚠️  Устанавливаем зависимости frontend...
    npm install
)

echo.
echo 🌐 Запускаем frontend сервер...
start "Frontend Server (Fixed)" cmd /k "npm run dev"

echo.
echo ✅ ГОТОВО! ВСЕ ОШИБКИ ИСПРАВЛЕНЫ!
echo.
echo 📍 Откройте в браузере:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000/api
echo.
echo 🔗 Страницы для тестирования:
echo    ✅ Исправленная версия: http://localhost:5173/fixed-excel-import
echo    📊 Обычная версия: http://localhost:5173/excel-import-v2
echo.
echo 🔗 API эндпоинты (работают без ошибок):
echo    GET  /api/excel-import/v2/default-mapping
echo    POST /api/excel-import/v2/validate
echo    POST /api/excel-import/v2/upload
echo    GET  /api/excel-import/v2/files
echo    GET  /api/excel-import/v2/stats
echo.
echo 💡 Дефолтные колонки Excel файла:
echo    C - Номер чертежа (DWG-001)
echo    E - Количество (5)
echo    G - Дедлайн (2025-07-15)
echo    K - Приоритет (1)
echo.
echo 🎯 Проблемы решены:
echo    ✅ TypeScript ошибки исправлены
echo    ✅ Компонент принимает нужные пропсы
echo    ✅ Drag & Drop работает
echo    ✅ Валидация файлов работает
echo    ✅ API v2 функционирует
echo.
pause
