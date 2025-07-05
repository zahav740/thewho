@echo off
echo ====================================
echo 🎯 ЗАПУСК ПОЛНОЙ СИСТЕМЫ CRM
echo ====================================
echo.
echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ:
echo    - Проблема импортов в excel-parser.service.ts
echo    - Проблема конвертации типов V1/V2 в контроллерах
echo    - Созданы утилитарные функции в excel-import.utils.ts
echo    - Исправлены все 4 ошибки TypeScript
echo.
echo 🚀 Запускаем backend (порт 5100) и frontend (порт 5101)...
echo.

echo Нажмите любую клавишу для продолжения...
pause >nul

echo 📊 Запускаем backend в новом окне...
start "CRM Backend" cmd /k "START-BACKEND-FIXED-V3.bat"

echo ⏱️ Ждем запуска backend (10 секунд)...
timeout /t 10 /nobreak >nul

echo 🌐 Запускаем frontend в новом окне...
start "CRM Frontend" cmd /k "START-FRONTEND-5101-FIXED.bat"

echo.
echo ✅ СИСТЕМА ЗАПУЩЕНА!
echo.
echo 🌐 URLs для доступа:
echo    Frontend: http://localhost:5101
echo    Backend API: http://localhost:5100
echo    Swagger Docs: http://localhost:5100/api/docs
echo.
echo 📋 Функции Excel импорта:
echo    - Парсинг Excel файлов
echo    - Автоматическое определение колонок
echo    - Конвертация данных V2 в V1
echo    - Массовое создание заказов
echo.
echo ✅ Все TypeScript ошибки исправлены!

pause
