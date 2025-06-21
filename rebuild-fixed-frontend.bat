@echo off
echo ===================================
echo Пересборка с исправленной формой входа
echo ===================================

cd frontend

echo Сборка обновленного приложения...
npm run build

if not exist "build" (
    echo Ошибка: сборка не создалась
    pause
    exit /b 1
)

echo Создание обновленного архива...
cd build
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-fixed.zip' -Force"
cd ..\..

echo.
echo ✅ Обновленный архив создан: frontend-fixed.zip
echo 📋 Загрузите его на сервер и замените build/
echo.
pause