@echo off
echo ============================================
echo  ЗАПУСК CRM С ИСПРАВЛЕННОЙ ФОРМОЙ ЗАКАЗОВ
echo ============================================
echo.

echo ✅ Все проблемы с формой заказов исправлены:
echo    - Операции не добавляются автоматически  
echo    - Все операции можно удалить
echo    - Заказы корректно удаляются из списка
echo.

echo 🔧 Настраиваем локальную разработку...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo 📡 Запускаем backend на порту 5100...
start "Backend" cmd /k "cd backend && npm run start:dev"

echo.
echo ⏳ Ожидание запуска backend (10 секунд)...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Запускаем frontend на порту 5101...
cd frontend
start "Frontend" cmd /k "npm start"

echo.
echo ✅ Приложение запускается...
echo.
echo 📝 Что исправлено:
echo    ✅ Операции не появляются автоматически
echo    ✅ Можно удалить все операции
echo    ✅ Заказы удаляются из списка
echo    ✅ Настроен локальный API
echo.
echo 🌐 Откройте браузер: http://localhost:5101
echo 📡 Backend API: http://localhost:5100/api
echo.
pause