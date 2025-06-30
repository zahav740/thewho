@echo off
echo =====================================================
echo    СОЗДАНИЕ EXCEL ФАЙЛА OEE/KPI ДЛЯ ПРОИЗВОДСТВА
echo =====================================================
echo.

echo 🔍 Проверяем Python...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python не найден! Установите Python с python.org
    pause
    exit /b 1
)

echo.
echo 📦 Устанавливаем необходимые библиотеки...
pip install -r requirements.txt

echo.
echo 🚀 Запускаем генератор Excel файла...
python create_oee_excel.py

echo.
echo ✅ Готово! Проверьте папку на наличие нового Excel файла.
echo.
pause
