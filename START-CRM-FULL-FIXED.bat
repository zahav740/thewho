@echo off
title ПОЛНЫЙ ЗАПУСК CRM - ИСПРАВЛЕННАЯ ВЕРСИЯ
color 0E

echo =======================================================
echo ПОЛНЫЙ ЗАПУСК CRM СИСТЕМЫ С ИСПРАВЛЕННЫМИ TYPESCRIPT
echo =======================================================
echo.
echo Backend: http://localhost:5100 
echo Frontend: http://localhost:5101
echo.

echo 🔧 ИСПРАВЛЕНИЯ ВКЛЮЧАЮТ:
echo ✅ Все типы Express импортированы правильно
echo ✅ Колонка K имеет приоритет над J в Excel парсере  
echo ✅ Порты настроены: Backend=5100, Frontend=5101
echo ✅ Все middleware исправлены
echo ✅ Все контроллеры исправлены
echo.

echo 📋 ЗАПУСКАЕМ BACKEND...
start /min cmd /k "cd backend && echo Backend запускается... && npm run start:dev"

echo Ожидаем запуск backend...
timeout /t 5 /nobreak >nul

echo.
echo 📋 ЗАПУСКАЕМ FRONTEND...
start /min cmd /k "cd frontend && echo Frontend запускается... && set PORT=5101 && npm run start"

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА!
echo.
echo 🌐 Откройте в браузере: http://localhost:5101
echo 📚 API Documentation: http://localhost:5100/api/docs
echo.
echo 📊 ИЗМЕНЕНИЯ В EXCEL ИМПОРТЕ:
echo - Колонка K теперь имеет приоритет над J для номера чертежа
echo - Улучшена обработка Hebrew колонок
echo - Исправлены все ошибки TypeScript
echo.

pause
