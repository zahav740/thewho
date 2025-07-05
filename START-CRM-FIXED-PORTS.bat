@echo off
echo 🚀 Запуск системы Production CRM на портах 5100 (backend) и 5101 (frontend)
echo.

echo 📡 Проверяем порты...
netstat -an | findstr :5100
netstat -an | findstr :5101
echo.

echo 🔧 Запуск Backend на порту 5100...
cd backend
start "Production CRM Backend" cmd /k "npm run start:dev"
echo ✅ Backend запущен на http://localhost:5100

echo.
echo 🎨 Запуск Frontend на порту 5101...
cd ../frontend
start "Production CRM Frontend" cmd /k "npm start"
echo ✅ Frontend запущен на http://localhost:5101

echo.
echo 🎯 Все сервисы запущены!
echo 📖 Backend API: http://localhost:5100/api
echo 🌐 Frontend: http://localhost:5101
echo 📚 API Docs: http://localhost:5100/api/docs
echo.
echo 💡 Теперь можно загружать Excel файлы с колонкой K как приоритетной!
pause
