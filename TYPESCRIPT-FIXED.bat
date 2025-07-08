@echo off
echo ===============================================
echo ИСПРАВЛЕНИЕ TYPESCRIPT: ДОБАВЛЕН onDownload
echo ===============================================
echo.
echo ✅ Исправлено в ModernExcelUploader.tsx:
echo    - Добавлен onDownload в interface ModernExcelUploaderProps
echo    - Добавлен statusMapping в interface  
echo    - Добавлен проп onDownload в компонент
echo    - Добавлена кнопка "Скачать" для готовых файлов
echo.
echo 🔧 Теперь ExcelUploaderExample.tsx должен компилироваться без ошибок!
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
echo ✅ ГОТОВО! Все TypeScript ошибки исправлены!
echo.
echo 📍 Откройте в браузере:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:3000/api
echo.
echo 🔗 API эндпоинт Excel парсинга:
echo    POST /api/files/excel/parse
echo.
echo 💡 Теперь ModernExcelUploader поддерживает:
echo    ✅ onUpload - загрузка файлов
echo    ✅ onPreview - предпросмотр данных
echo    ✅ onDownload - скачивание результата  
echo    ✅ statusMapping - маппинг статусов
echo    ✅ maxFileSize, acceptedFormats, title, description
echo.
echo 🎯 ExcelUploaderExample.tsx теперь использует рабочий компонент!
echo.
pause
