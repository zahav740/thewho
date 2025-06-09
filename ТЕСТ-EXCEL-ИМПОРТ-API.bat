@echo off
echo ================================================
echo 🧪 ТЕСТИРОВАНИЕ EXCEL ИМПОРТА ЗАКАЗОВ
echo ================================================

set BACKEND_URL=http://localhost:5100/api/enhanced-orders

echo.
echo 📋 Доступные тесты:
echo.
echo 1. 🔍 Анализ Excel файла (analyze-excel)
echo 2. 🎯 Выборочный импорт заказов (import-selected-orders)  
echo 3. 🚀 Полный импорт с фильтрами (upload-excel-full)
echo 4. 📊 Получить все заказы (GET /enhanced-orders)
echo 5. 🗑️ Удалить все заказы (DELETE /enhanced-orders/all/confirm)
echo 6. ❌ Выход
echo.

set /p choice="Выберите тест (1-6): "

if "%choice%"=="1" goto test_analyze
if "%choice%"=="2" goto test_import_selected
if "%choice%"=="3" goto test_import_full
if "%choice%"=="4" goto test_get_orders
if "%choice%"=="5" goto test_delete_all
if "%choice%"=="6" goto exit
goto menu

:test_analyze
cls
echo 🔍 ТЕСТ: Анализ Excel файла
echo ================================================
echo.
echo Этот тест анализирует Excel файл и показывает все найденные заказы
echo с цветовым кодированием и статистикой.
echo.
echo Для теста вам нужен Excel файл с заказами.
echo Структура файла: A=Номер чертежа, B=Количество, C=Срок, D=Приоритет, E=Тип работы
echo.

set /p filepath="Введите путь к Excel файлу: "

if not exist "%filepath%" (
    echo ❌ Файл не найден: %filepath%
    pause
    goto menu
)

echo.
echo 🔄 Отправляем файл на анализ...

curl -X POST ^
  -F "excel=@%filepath%" ^
  %BACKEND_URL%/analyze-excel

echo.
echo ✅ Тест завершен!
pause
goto menu

:test_import_selected
cls
echo 🎯 ТЕСТ: Выборочный импорт заказов
echo ================================================
echo.
echo Этот тест импортирует только выбранные заказы по цветовым фильтрам.
echo.

set /p filepath="Введите путь к Excel файлу: "

if not exist "%filepath%" (
    echo ❌ Файл не найден: %filepath%
    pause
    goto menu
)

echo.
echo 📋 Настройки импорта:
set /p selected_orders="Номера чертежей через запятую (например: DRW-001,DRW-002): "
set /p color_filters="Цветовые фильтры через запятую (red,yellow,green,blue): "
set /p clear_existing="Очистить существующие данные? (true/false): "
set /p skip_duplicates="Пропускать дубликаты? (true/false): "

echo.
echo 🔄 Выполняем выборочный импорт...

curl -X POST ^
  -F "excel=@%filepath%" ^
  -F "selectedOrders=[\"%selected_orders:\,=\",\"%\"]" ^
  -F "colorFilters=[\"%color_filters:\,=\",\"%\"]" ^
  -F "clearExisting=%clear_existing%" ^
  -F "skipDuplicates=%skip_duplicates%" ^
  %BACKEND_URL%/import-selected-orders

echo.
echo ✅ Тест завершен!
pause
goto menu

:test_import_full
cls
echo 🚀 ТЕСТ: Полный импорт с фильтрами
echo ================================================
echo.

set /p filepath="Введите путь к Excel файлу: "

if not exist "%filepath%" (
    echo ❌ Файл не найден: %filepath%
    pause
    goto menu
)

echo.
echo 🔄 Выполняем полный импорт...

curl -X POST ^
  -F "excel=@%filepath%" ^
  -F "importSettings={\"colorFilters\":[{\"color\":\"red\",\"selected\":true},{\"color\":\"yellow\",\"selected\":true}],\"importOnlySelected\":false,\"clearExistingData\":false,\"skipDuplicates\":true}" ^
  %BACKEND_URL%/upload-excel-full

echo.
echo ✅ Тест завершен!
pause
goto menu

:test_get_orders
cls
echo 📊 ТЕСТ: Получить все заказы
echo ================================================
echo.
echo 🔄 Получаем список всех заказов...

curl -X GET %BACKEND_URL%

echo.
echo ✅ Тест завершен!
pause
goto menu

:test_delete_all
cls
echo 🗑️ ТЕСТ: Удалить все заказы
echo ================================================
echo.
echo ⚠️ ВНИМАНИЕ: Это удалит ВСЕ заказы из базы данных!
echo.
set /p confirm="Вы уверены? Введите 'YES' для подтверждения: "

if not "%confirm%"=="YES" (
    echo ❌ Операция отменена.
    pause
    goto menu
)

echo.
echo 🔄 Удаляем все заказы...

curl -X DELETE ^
  -H "Content-Type: application/json" ^
  -d "{\"confirm\":true}" ^
  %BACKEND_URL%/all/confirm

echo.
echo ✅ Тест завершен!
pause
goto menu

:menu
cls
goto start

:start
goto choice

:exit
echo.
echo 👋 До свидания!
exit /b 0
