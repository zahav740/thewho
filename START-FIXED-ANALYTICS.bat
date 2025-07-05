@echo off
echo ===============================================
echo 🚀 Запуск Production CRM с исправленной аналитикой
echo ===============================================
echo.

echo 📋 Что было исправлено:
echo - ✅ Удалены мок-данные из KPI/OEE компонентов
echo - ✅ Добавлен Analytics API module в backend
echo - ✅ Добавлены тестовые данные в БД (3 смены)
echo - ✅ Frontend переведен на реальные API запросы
echo - ✅ Добавлена обработка ошибок и fallback данные
echo.

echo 🔧 Запускаем backend...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "echo Backend запущен на http://localhost:5100 && npm run start:dev"

echo ⏳ Ждем 5 секунд для запуска backend...
timeout /t 5

echo 🌐 Запускаем frontend...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "echo Frontend запущен на http://localhost:3000 && npm start"

echo.
echo ===============================================
echo 🎯 Готово! Откройте:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5100/api
echo - Analytics API: http://localhost:5100/api/analytics/kpi-oee
echo.
echo 📊 Для тестирования аналитики:
echo 1. Перейдите в раздел "KPI и OEE"
echo 2. Данные загрузятся с реального API
echo 3. Если API недоступен - показывает fallback данные
echo ===============================================
pause
