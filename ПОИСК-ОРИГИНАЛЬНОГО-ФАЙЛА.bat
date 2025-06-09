@echo off
echo ========================================
echo ПОИСК ОРИГИНАЛЬНОГО EXCEL ФАЙЛА
echo ========================================

echo 🔍 Ищем файлы Excel в системе...

echo.
echo 📁 Проверяем папку uploads/excel:
if exist "backend\uploads\excel" (
    dir "backend\uploads\excel\*.xlsx" /o:d
    echo.
    echo 📊 Последние загруженные файлы могут содержать оригинальные данные
) else (
    echo ❌ Папка uploads\excel не найдена
)

echo.
echo 📁 Проверяем Downloads:
if exist "%USERPROFILE%\Downloads" (
    echo Ищем оригинальный файл "תוכנית ייצור מאסטר 2025.xlsx" в Downloads...
    dir "%USERPROFILE%\Downloads\*מאסטר*.xlsx" 2>nul
    dir "%USERPROFILE%\Downloads\*תוכנית*.xlsx" 2>nul
    dir "%USERPROFILE%\Downloads\*ייצור*.xlsx" 2>nul
) else (
    echo ⚠️ Папка Downloads недоступна
)

echo.
echo 📁 Проверяем рабочий стол:
if exist "%USERPROFILE%\Desktop" (
    echo Ищем Excel файлы на рабочем столе...
    dir "%USERPROFILE%\Desktop\*.xlsx" 2>nul
)

echo.
echo 📁 Проверяем Documents:
if exist "%USERPROFILE%\Documents" (
    echo Ищем Excel файлы в Documents...
    dir "%USERPROFILE%\Documents\*.xlsx" 2>nul
)

echo.
echo 🔄 Проверяем Recycle Bin (если файл был удален):
echo Откройте корзину и найдите файл "תוכנית ייצור מאסטר 2025.xlsx"

echo.
echo ========================================
echo ОТКЛЮЧЕНИЕ ТЕСТОВЫХ ДАННЫХ В ЭКСПОРТЕ
echo ========================================

echo.
echo 🛠️ Создаем резервную копию скрипта экспорта...
if exist "export-orders-to-filesystem.js" (
    copy "export-orders-to-filesystem.js" "export-orders-to-filesystem.js.backup" >nul
    echo ✅ Создана резервная копия: export-orders-to-filesystem.js.backup
) else (
    echo ⚠️ Скрипт экспорта не найден
)

echo.
echo ========================================
echo РЕКОМЕНДАЦИИ:
echo ========================================
echo.
echo 1. 🔍 НАЙДИТЕ ОРИГИНАЛЬНЫЙ ФАЙЛ:
echo    - Проверьте Downloads
echo    - Проверьте рабочий стол
echo    - Проверьте корзину
echo    - Проверьте облачные диски (OneDrive, Google Drive)
echo.
echo 2. 📋 СКОПИРУЙТЕ ОРИГИНАЛЬНЫЙ ФАЙЛ В ПРОЕКТ:
echo    - Поместите оригинальный файл в корень проекта
echo    - Переименуйте его в "תוכנית-ייצור-מאסטר-2025-ORIGINAL.xlsx"
echo.
echo 3. 🚫 ОТКЛЮЧИТЕ ТЕСТОВЫЕ ДАННЫЕ:
echo    - Не запускайте EXPORT-ORDERS.bat
echo    - Не запускайте export-orders-to-filesystem.js
echo.
echo 4. ✅ ПРОТЕСТИРУЙТЕ ИМПОРТ:
echo    - Загрузите найденный оригинальный файл через интерфейс
echo    - Проверьте, что данные настоящие
echo ========================================

pause
