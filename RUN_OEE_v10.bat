@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🚀 ЗАПУСК ГЕНЕРАТОРА OEE/KPI v10.0
echo ========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo 📍 Рабочая директория: %CD%
echo.

echo 🔧 Проверка Python...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python не найден! Установите Python 3.x
    pause
    exit /b 1
)

echo.
echo 📦 Проверка библиотек...
python -c "import openpyxl; print('✅ openpyxl доступен')" 2>nul
if %errorlevel% neq 0 (
    echo ⚡ Устанавливаем openpyxl...
    pip install openpyxl
)

echo.
echo 🎯 Запуск тестовой версии...
python test_excel.py
if %errorlevel% neq 0 (
    echo ❌ Ошибка в тестовой версии!
    pause
    exit /b 1
)

echo.
echo 🏭 Запуск основного генератора OEE/KPI...
python script_name.py

echo.
echo ✅ Генерация завершена!
echo 📂 Проверьте созданные .xlsx файлы в текущей директории
echo.

dir *.xlsx /od

echo.
echo 🎉 Готово! Нажмите любую клавишу для выхода...
pause >nul
