@echo off
echo =================================
echo ЗАПУСК КОМПАКТНЫХ КАРТОЧЕК
echo =================================
echo.
echo Переходим в папку frontend...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo.
echo Устанавливаем зависимости (если нужно)...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
)

echo.
echo Запускаем frontend с компактными карточками...
echo Приложение будет доступно по адресу: http://localhost:5101
echo.
echo Новые возможности:
echo - Компактные карточки станков (по умолчанию)
echo - Подробная информация по клику на "Подробно"
echo - Переключатель "Компактные/Подробные карточки"
echo - Чистый минималистичный дизайн
echo.
echo =================================

npm start

pause
