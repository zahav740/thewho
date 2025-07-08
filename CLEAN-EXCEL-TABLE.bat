@echo off
echo ============================================
echo   ОЧИСТКА И ПЕРЕСОЗДАНИЕ ТАБЛИЦ
echo ============================================
echo.

echo ⚠️ ВНИМАНИЕ: Это удалит существующую таблицу excel_files!
echo Все данные в ней будут потеряны.
echo.
set /p confirm="Продолжить? (y/N): "
if /i not "%confirm%"=="y" (
    echo Операция отменена.
    pause
    exit /b 0
)

echo.
echo 🗑️ Удаляем проблемную таблицу excel_files...

REM Удаляем таблицу если она существует
psql -U postgres -d thewho -c "DROP TABLE IF EXISTS excel_files CASCADE;" 2>nul

echo ✅ Таблица удалена (если существовала)
echo.
echo 🏗️ Теперь запустите: START-BACKEND-FIXED.bat
echo.
pause
