@echo off
echo ===================================
echo Создание готового PRODUCTION архива
echo ===================================

cd frontend

rem Сначала соберем локально
echo Сборка React приложения...
npm run build

if not exist "build" (
    echo Ошибка: сборка не создалась
    pause
    exit /b 1
)

echo Проверка сборки...
dir build\

rem Создаем архив готовой сборки
echo Создание архива готовой сборки...
powershell -Command "Compress-Archive -Path '.\build\*' -DestinationPath '..\frontend-ready.zip' -Force"

cd ..

echo.
echo ✅ Готовый архив создан: frontend-ready.zip
echo.
echo Размер архива:
for %%F in (frontend-ready.zip) do echo %%~zF bytes
echo.
echo 📋 Следующие шаги:
echo 1. Загрузите frontend-ready.zip на сервер в /var/upload/frontend/
echo 2. На сервере выполните:
echo    cd /var/upload/frontend/
echo    unzip -o frontend-ready.zip -d build/
echo    pkill -f serve
echo    nohup serve -s build -l 5201 ^> frontend.log 2^>^&1 ^&
echo.
pause