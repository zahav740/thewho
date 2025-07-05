@echo off
echo ====================================
echo ПОЛНОЕ ТЕСТИРОВАНИЕ EXCEL IMPORT
echo ====================================
echo.

echo 🔍 Шаг 1: Проверка состояния системы...
cd /d "%~dp0"

echo 📊 Создаем демонстрационные Excel файлы...
node scripts\create-test-excel.js
if errorlevel 1 (
    echo ❌ Ошибка создания демонстрационных файлов
    pause
    exit /b 1
)

echo.
echo 🔍 Шаг 2: Проверка backend...
node scripts\check-excel-system.js
if errorlevel 1 (
    echo ❌ Backend недоступен. Запустите: cd backend ^&^& npm run start:dev
    pause
    exit /b 1
)

echo.
echo 🎯 Шаг 3: Инструкции по тестированию...
echo.
echo ✅ ВСЕ ГОТОВО! Теперь можете тестировать:
echo.
echo 1. Откройте http://localhost:5101
echo 2. Перейдите в раздел "База данных"
echo 3. Нажмите "🗄️ Excel БД Менеджер"
echo 4. Выберите фильтр "Стандартный импорт заказов"
echo 5. Перетащите один из файлов:
echo    - test-orders-excel-import.xlsx (русские заголовки)
echo    - test-orders-english.xlsx (английские заголовки)
echo.
echo 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
echo ✅ Файл сохранится в backend\uploads\excel\
echo ✅ Запись появится в таблице excel_imports
echo ✅ Все ячейки сохранятся в таблице excel_data
echo ✅ Данные импортируются в таблицу orders
echo ✅ Отчет появится в интерфейсе
echo.
echo 📊 ЧТО ПРОВЕРИТЬ В БД:
echo 1. SELECT COUNT(*) FROM excel_imports; -- должно увеличиться
echo 2. SELECT COUNT(*) FROM excel_data; -- должно появиться много записей
echo 3. SELECT COUNT(*) FROM orders; -- должно увеличиться
echo 4. SELECT * FROM excel_imports ORDER BY created_at DESC LIMIT 1; -- последний импорт
echo.
echo 🔧 Если что-то не работает:
echo 1. Проверьте логи backend в консоли
echo 2. Проверьте Network tab в браузере (F12)
echo 3. Убедитесь, что порт 5100 свободен
echo 4. Перезапустите backend: cd backend ^&^& npm run start:dev
echo.
echo ====================================
echo ГОТОВО К ТЕСТИРОВАНИЮ!
echo ====================================
pause
