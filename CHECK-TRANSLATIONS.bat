@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 ПРОВЕРКА ПРИМЕНЕНИЯ ПЕРЕВОДОВ
echo ========================================
echo.

echo 📝 Перезапуск frontend для применения изменений...
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo 🛑 Останавливаем текущий процесс frontend...
taskkill /f /im node.exe >nul 2>&1

echo 📁 Переходим в папку frontend...
cd frontend

echo 🚀 Запускаем frontend сервер...
echo.
echo ⏳ Ожидайте запуска сервера...
echo 🌍 После запуска переключите язык на English и проверьте страницу Active Operations
echo.

start /B npm start

echo.
echo ✅ Frontend сервер запускается...
echo 🌐 Откройте браузер: http://localhost:3000
echo 🔄 Переключите язык на "English" в правом верхнем углу
echo 📋 Перейдите на страницу "Active Operations"
echo.
echo 🎯 ВСЕ ТЕКСТЫ ДОЛЖНЫ БЫТЬ НА АНГЛИЙСКОМ!
echo.

pause