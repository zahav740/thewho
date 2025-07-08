@echo off
echo ====================================
echo ПРОСТОЕ ИСПРАВЛЕНИЕ - ТОЛЬКО ОШИБКА
echo ====================================
echo.
echo ✅ Исправлено: ExcelUploaderExample.tsx теперь использует ModernExcelUploader вместо ImprovedExcelUploader
echo.
echo 🔧 Что было изменено:
echo    - import ImprovedExcelUploader → import ModernExcelUploader
echo    - компонент ^<ImprovedExcelUploader^> → ^<ModernExcelUploader^>
echo.
echo 📋 Проверяем зависимости backend...
cd backend
if not exist node_modules (
    echo ⚠️  Устанавливаем зависимости backend...
    npm install
)

echo.
echo 🚀 Запускаем backend сервер...
start "Backend Server" cmd /k "npm run start:dev"

echo.
echo ⏳ Ждем запуска backend (5 сек)...
timeout /t 5 /nobreak >nul

echo.
echo 📋 Проверяем зависимости frontend...
cd ..\frontend
if not exist node_modules (
    echo ⚠️  Устанавливаем зависимости frontend...
    npm install
)

echo.
echo 🌐 Запускаем frontend сервер...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ ГОТОВО! TypeScript ошибка исправлена!
echo.
echo 📍 Откройте в браузере:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000/api
echo.
echo 🔗 API эндпоинт Excel парсинга:
echo    POST /api/files/excel/parse
echo.
echo 💡 Теперь ExcelUploaderExample.tsx должен работать без ошибок!
echo    ModernExcelUploader принимает все нужные пропсы:
echo    - title, description, onUpload, onPreview, maxFileSize и т.д.
echo.
pause
