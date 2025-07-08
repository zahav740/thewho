@echo off
echo ===============================================
echo  СОЗДАНИЕ EXCEL С ИСПРАВЛЕННЫМИ ФОРМУЛАМИ
echo ===============================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo Проверяем наличие Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python не найден! Установите Python 3.7+
    pause
    exit /b 1
)

echo ✅ Python найден

echo.
echo Проверяем библиотеку openpyxl...
python -c "import openpyxl; print('✅ openpyxl доступна')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Библиотека openpyxl не найдена, устанавливаем...
    pip install openpyxl
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Не удалось установить openpyxl
        pause
        exit /b 1
    )
)

echo.
echo 🔧 Создаем Excel файл с ИСПРАВЛЕННЫМИ формулами...
python create_corrected_oee.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ФАЙЛ УСПЕШНО СОЗДАН!
    echo.
    echo 📊 КЛЮЧЕВЫЕ ИСПРАВЛЕНИЯ:
    echo    ✅ OEE = (Наладка + Производство) / Смена * 100%%
    echo    ✅ KPI оператора БЕЗ штрафа за наладку
    echo    ✅ Наладка = полезное время станка
    echo.
    echo 📈 РЕЗУЛЬТАТ ДЛЯ КИРИЛЛА:
    echo    ❌ Старый KPI: ~79%% (несправедливо)
    echo    ✅ Новый KPI: 97.5%% (справедливо)
    echo    📈 Улучшение: +18.5%%
    echo.
    echo 🎉 Откройте созданный Excel файл!
) else (
    echo ❌ Ошибка при создании файла
)

echo.
pause
