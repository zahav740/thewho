@echo off
echo ===================================
echo Создание архива готовой сборки
echo ===================================

cd frontend\build

echo Проверка содержимого build:
dir

echo.
echo Создание архива...
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -Force"

cd ..\..

echo.
echo ✅ Архив создан: frontend-production.zip

rem Проверим размер
for %%F in (frontend-production.zip) do echo Размер: %%~zF bytes

echo.
echo 📋 Следующие шаги:
echo 1. Загрузите frontend-production.zip на сервер в /var/upload/frontend/
echo 2. На сервере выполните команды из следующего сообщения
echo.
pause