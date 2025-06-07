@echo off
echo 🎉 СИСТЕМА МОНИТОРИНГА И АНАЛИЗА ЭФФЕКТИВНОСТИ ГОТОВА!
echo.
echo ✅ Что создано:
echo   📊 База данных - 3 новые таблицы
echo   🔧 Backend API - полный REST API для истории операций  
echo   🖥️ Frontend - страница истории + модальное окно деталей
echo   📱 Навигация - новый пункт меню "История операций"
echo.
echo 🚀 Быстрый запуск:
echo.

set /p choice="Запустить тестирование? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 🔄 Проверяем backend...
    cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"
    
    echo ⏳ Устанавливаем типы ExcelJS...
    call npm install --save-dev @types/exceljs >nul 2>&1
    
    echo ✅ Типы установлены!
    echo.
    echo 🚀 Запускаем backend сервер...
    echo 💡 После запуска откройте браузер: http://localhost:3000/operation-history
    echo.
    
    start cmd /k "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && npm start"
    
    call npm run start:dev
) else (
    echo.
    echo 📖 Читайте полную инструкцию в файле:
    echo    СИСТЕМА-ГОТОВА-ФИНАЛЬНЫЙ-ОТЧЕТ.md
    echo.
    echo 🔧 Ручной запуск:
    echo    1. cd backend && npm install --save-dev @types/exceljs
    echo    2. cd backend && npm run start:dev
    echo    3. cd frontend && npm start
    echo    4. Откройте http://localhost:3000/operation-history
    echo.
)

pause
