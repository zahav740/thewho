@echo off
echo ===============================================
echo 🔧 ИСПРАВЛЕНИЕ TYPESCRIPT И ЗАПУСК FRONTEND
echo ===============================================

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo 🔍 Проверяем TypeScript ошибки...

call npx tsc --noEmit

if errorlevel 1 (
    echo ⚠️ Найдены TypeScript ошибки, но продолжаем сборку...
) else (
    echo ✅ TypeScript проверка прошла успешно!
)

echo.
echo 🔧 Устанавливаем зависимости (если нужно)...
call npm install

echo.
echo 🚀 Запускаем frontend в режиме разработки...
echo Frontend будет доступен на: http://localhost:3000 или http://localhost:5101
echo.
echo 📊 Для тестирования нового Excel импорта:
echo 1. Дождитесь запуска frontend
echo 2. Перейдите в раздел "База данных"
echo 3. Нажмите кнопку "Excel 2.0"
echo 4. Загрузите файл Excel и следуйте мастеру импорта
echo.

call npm start

pause
