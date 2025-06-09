@echo off
echo ========================================
echo ПЕРЕЗАПУСК FRONTEND С ИСПРАВЛЕНИЯМИ
echo ========================================

echo [1/3] Останавливаем frontend процессы...
tasklist | findstr "3000\|5101" >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️ Найдены процессы на портах 3000/5101, завершаем...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3000.*LISTENING"') do taskkill /f /pid %%i 2>nul
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5101.*LISTENING"') do taskkill /f /pid %%i 2>nul
    timeout /t 3 /nobreak >nul
) else (
    echo ✅ Порты свободны
)

echo.
echo [2/3] Переходим в директорию frontend...
cd /d "%~dp0\frontend"
if not exist package.json (
    echo ❌ Frontend директория не найдена!
    pause
    exit /b 1
)
echo ✅ В директории frontend

echo.
echo [3/3] Запускаем frontend с исправлениями TypeScript...
echo.
echo 🔧 ИСПРАВЛЕНИЯ В ЭТОЙ ВЕРСИИ:
echo   ✅ Исправлены ошибки TypeScript в ExcelUploaderWithSettings
echo   ✅ Добавлены опции "Выборочно" и "Все" для отображения заказов
echo   ✅ Корректная типизация ImportSettings
echo   ✅ Правильное слияние настроек с defaultImportSettings
echo.
echo 🚀 Запускаем на порту 5101...

set PORT=5101
start "🌐 Frontend (TypeScript Fixed)" cmd /k "title Frontend 5101 - TS Fixed && echo FRONTEND STARTING WITH TYPESCRIPT FIXES... && npm start"

echo.
echo ========================================
echo FRONTEND ЗАПУСКАЕТСЯ С ИСПРАВЛЕНИЯМИ!
echo ========================================
echo 🌐 URL: http://localhost:5101
echo 📋 Новые функции:
echo   - Кнопка "Выборочно" - показать отфильтрованные заказы
echo   - Кнопка "Все" - показать все заказы из файла
echo   - Динамические счетчики заказов
echo   - Индикаторы режима отображения
echo ========================================

timeout /t 5 /nobreak >nul

echo Проверяем запуск...
timeout /t 10 /nobreak >nul

curl -s http://localhost:5101 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend успешно запущен на порту 5101!
    echo 🎯 Готов к тестированию новых опций
) else (
    echo ⚠️ Frontend еще запускается, подождите немного...
)

echo.
echo ✨ Готово! Можете тестировать новые опции отображения заказов
pause
