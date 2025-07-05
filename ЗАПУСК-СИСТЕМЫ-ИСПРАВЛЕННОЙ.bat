@echo off
chcp 65001 > nul
echo.
echo 🚀 ЗАПУСК ПОЛНОЙ СИСТЕМЫ CRM (ИСПРАВЛЕННАЯ ВЕРСИЯ)
echo ===============================================
echo.

cd /d "%~dp0"

echo 🔧 ИСПРАВЛЕНИЯ ВЫПОЛНЕНЫ:
echo ✅ 1. orders.controller.ts: импорт типов Express исправлен
echo ✅ 2. Порт backend: 5100 (уже настроен)
echo ✅ 3. Порт frontend: 5101 (уже настроен)  
echo ✅ 4. Excel импорт: колонка K имеет приоритет над J
echo.

echo 📋 ИНСТРУКЦИЯ ПО EXCEL ИМПОРТУ:
echo Загружайте Excel файлы с колонками:
echo • Колонка C: Номер чертежа
echo • Колонка E: Количество
echo • Колонка H: Дедлайн (дата)
echo • Колонка K: Приоритет (система автоматически использует K вместо J)
echo.

echo 🌐 URL-адреса после запуска:
echo • Frontend: http://localhost:5101
echo • Backend API: http://localhost:5100/api
echo • Swagger docs: http://localhost:5100/api/docs
echo.

echo 🚀 Запускаем backend...
start "CRM Backend" cmd /c "cd backend && npx ts-node --transpile-only src/main.ts"

echo.
echo ⏳ Ждем 5 секунд для запуска backend...
timeout /t 5 /nobreak > nul

echo.
echo 🚀 Запускаем frontend...
start "CRM Frontend" cmd /c "cd frontend && npm run start"

echo.
echo ✅ Система запущена!
echo.
echo 📖 Проверьте:
echo • Backend в консоли "CRM Backend"
echo • Frontend в консоли "CRM Frontend" 
echo • Откройте http://localhost:5101 в браузере
echo.

echo 🔍 Для проверки секции "Заказы":
echo 1. Откройте http://localhost:5101
echo 2. Перейдите в раздел "Заказы"
echo 3. Нажмите "Excel импорт"
echo 4. Загрузите файл с данными в колонке K
echo.

pause
