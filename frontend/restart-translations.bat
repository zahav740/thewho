@echo off
echo.
echo 🔄 Перезапуск системы переводов Production CRM
echo.

cd /d "%~dp0"

echo 📋 Шаг 1: Очистка кэша браузера...
echo    - Откройте браузер
echo    - Нажмите Ctrl+Shift+R (принудительная перезагрузка)
echo    - Или F12 -> Application -> Storage -> Clear site data
echo.

echo 🔄 Шаг 2: Перезапуск Frontend сервера...
echo    - Остановите текущий npm start (Ctrl+C)
echo    - Запустите заново: npm start
echo.

echo 🌐 Шаг 3: Проверка переводов...
echo.
echo ✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ ПОСЛЕ ИСПРАВЛЕНИЙ:
echo.
echo    📄 Страница ПРОИЗВОДСТВО (/production):
echo       ❌ Было: machine.action.mark_busy
echo       ✅ Стало: "Пометить как занятый"
echo       
echo       ❌ Было: machine.action.select  
echo       ✅ Стало: "Выбрать"
echo.
echo    📄 Страница СМЕНЫ (/shifts):
echo       ❌ Было: shifts.production_by_operation
echo       ✅ Стало: "Производство по операции"
echo       
echo       ❌ Было: shifts.minutes
echo       ✅ Стало: "мин"
echo       
echo       ❌ Было: shifts.parts_suffix  
echo       ✅ Стало: "деталей"
echo       
echo       ❌ Было: shifts.day / shifts.night
echo       ✅ Стало: "День" / "Ночь"
echo.
echo    📄 Страница ОПЕРАТОРЫ (/operators):
echo       ❌ Было: operators.add_operator
echo       ✅ Стало: "Добавить оператора"
echo.

echo 🧪 Шаг 4: Тестирование переключения языков...
echo    1. Переключите на English
echo    2. Убедитесь что тексты переводятся
echo    3. Переключите обратно на Русский
echo.

echo 🔧 Если проблемы остались:
echo    1. Проверьте консоль браузера на ошибки (F12)
echo    2. Убедитесь что файл translations.ts сохранился
echo    3. Перезапустите весь проект (backend + frontend)
echo.

echo 📞 Для отладки запустите: check-translations.bat
echo.
pause
