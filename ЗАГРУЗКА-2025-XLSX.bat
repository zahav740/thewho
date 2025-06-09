@echo off
echo ================================================
echo 📊 ЗАГРУЗКА EXCEL ФАЙЛА 2025.xlsx В БАЗУ ДАННЫХ
echo ================================================

set BACKEND_URL=http://localhost:5100/api/enhanced-orders
set EXCEL_FILE=2025.xlsx

echo.
echo 🔍 Проверяем наличие файла...

if not exist "%EXCEL_FILE%" (
    echo ❌ Файл %EXCEL_FILE% не найден в текущей директории!
    echo.
    echo 📁 Пожалуйста, поместите файл 2025.xlsx в ту же папку что и этот скрипт.
    echo Текущая директория: %CD%
    echo.
    pause
    exit /b 1
)

echo ✅ Файл найден: %EXCEL_FILE%

echo.
echo 📋 Выберите действие:
echo.
echo 1. 🔍 Анализ файла (посмотреть структуру и количество заказов)
echo 2. 🚀 Полный импорт всех заказов
echo 3. 🎯 Выборочный импорт с фильтрами
echo 4. 📊 Показать все заказы из БД
echo 5. ❌ Выход
echo.

set /p choice="Ваш выбор (1-5): "

if "%choice%"=="1" goto analyze_file
if "%choice%"=="2" goto import_full
if "%choice%"=="3" goto import_selective
if "%choice%"=="4" goto show_orders
if "%choice%"=="5" goto exit
goto menu

:analyze_file
cls
echo 🔍 АНАЛИЗ ФАЙЛА 2025.xlsx
echo ================================================
echo.
echo 🔄 Отправляем файл на анализ...
echo.

curl -X POST ^
  -F "excel=@%EXCEL_FILE%" ^
  %BACKEND_URL%/analyze-excel ^
  --header "Accept: application/json" ^
  --silent --show-error | python -m json.tool 2>nul || (
    echo.
    echo ⚠️ Ответ сервера (возможно не JSON):
    curl -X POST -F "excel=@%EXCEL_FILE%" %BACKEND_URL%/analyze-excel
)

echo.
echo ✅ Анализ завершен!
echo.
pause
goto menu

:import_full
cls
echo 🚀 ПОЛНЫЙ ИМПОРТ ВСЕХ ЗАКАЗОВ
echo ================================================
echo.
echo ⚠️ Это загрузит ВСЕ заказы из файла в базу данных.
echo.
set /p confirm="Продолжить? (y/n): "

if /i not "%confirm%"=="y" goto menu

echo.
echo 🔄 Выполняем полный импорт...
echo.

curl -X POST ^
  -F "excel=@%EXCEL_FILE%" ^
  -F "importSettings={\"colorFilters\":[{\"color\":\"green\",\"selected\":true},{\"color\":\"yellow\",\"selected\":true},{\"color\":\"red\",\"selected\":true},{\"color\":\"blue\",\"selected\":true}],\"importOnlySelected\":false,\"clearExistingData\":false,\"skipDuplicates\":true}" ^
  %BACKEND_URL%/upload-excel-full ^
  --header "Accept: application/json" ^
  --silent --show-error | python -m json.tool 2>nul || (
    echo.
    echo ⚠️ Ответ сервера:
    curl -X POST -F "excel=@%EXCEL_FILE%" -F "importSettings={\"colorFilters\":[{\"color\":\"green\",\"selected\":true},{\"color\":\"yellow\",\"selected\":true},{\"color\":\"red\",\"selected\":true},{\"color\":\"blue\",\"selected\":true}],\"importOnlySelected\":false,\"clearExistingData\":false,\"skipDuplicates\":true}" %BACKEND_URL%/upload-excel-full
)

echo.
echo ✅ Импорт завершен!
echo.
pause
goto menu

:import_selective
cls
echo 🎯 ВЫБОРОЧНЫЙ ИМПОРТ С ФИЛЬТРАМИ
echo ================================================
echo.
echo 📋 Настройки импорта:
echo.
set /p clear_existing="Очистить существующие заказы? (y/n): "
set /p color_filters="Цветовые фильтры (red,yellow,green,blue или оставьте пустым для всех): "

if "%clear_existing%"=="y" (
    set clear_flag=true
) else (
    set clear_flag=false
)

if "%color_filters%"=="" (
    set filter_json=["red","yellow","green","blue"]
) else (
    set filter_json=["%color_filters:,=","%"]
)

echo.
echo 🔄 Выполняем выборочный импорт...
echo Очистка существующих: %clear_flag%
echo Цветовые фильтры: %filter_json%
echo.

curl -X POST ^
  -F "excel=@%EXCEL_FILE%" ^
  -F "selectedOrders=[]" ^
  -F "colorFilters=%filter_json%" ^
  -F "clearExisting=%clear_flag%" ^
  -F "skipDuplicates=true" ^
  %BACKEND_URL%/import-selected-orders ^
  --header "Accept: application/json" ^
  --silent --show-error | python -m json.tool 2>nul || (
    echo.
    echo ⚠️ Ответ сервера:
    curl -X POST -F "excel=@%EXCEL_FILE%" -F "selectedOrders=[]" -F "colorFilters=%filter_json%" -F "clearExisting=%clear_flag%" -F "skipDuplicates=true" %BACKEND_URL%/import-selected-orders
)

echo.
echo ✅ Выборочный импорт завершен!
echo.
pause
goto menu

:show_orders
cls
echo 📊 СПИСОК ВСЕХ ЗАКАЗОВ ИЗ БД
echo ================================================
echo.
echo 🔄 Получаем список заказов...
echo.

curl -X GET ^
  %BACKEND_URL% ^
  --header "Accept: application/json" ^
  --silent --show-error | python -m json.tool 2>nul || (
    echo.
    echo ⚠️ Ответ сервера:
    curl -X GET %BACKEND_URL%
)

echo.
echo ✅ Список получен!
echo.
pause
goto menu

:menu
cls
goto start

:start
echo ================================================
echo 📊 ЗАГРУЗКА EXCEL ФАЙЛА 2025.xlsx В БАЗУ ДАННЫХ
echo ================================================

echo.
echo 🔍 Проверяем наличие файла...

if not exist "%EXCEL_FILE%" (
    echo ❌ Файл %EXCEL_FILE% не найден в текущей директории!
    echo.
    echo 📁 Пожалуйста, поместите файл 2025.xlsx в ту же папку что и этот скрипт.
    echo Текущая директория: %CD%
    echo.
    pause
    exit /b 1
)

echo ✅ Файл найден: %EXCEL_FILE%

echo.
echo 📋 Выберите действие:
echo.
echo 1. 🔍 Анализ файла (посмотреть структуру и количество заказов)
echo 2. 🚀 Полный импорт всех заказов
echo 3. 🎯 Выборочный импорт с фильтрами
echo 4. 📊 Показать все заказы из БД
echo 5. ❌ Выход
echo.

set /p choice="Ваш выбор (1-5): "

if "%choice%"=="1" goto analyze_file
if "%choice%"=="2" goto import_full
if "%choice%"=="3" goto import_selective
if "%choice%"=="4" goto show_orders
if "%choice%"=="5" goto exit
goto menu

:exit
echo.
echo 👋 До свидания!
exit /b 0
