@echo off
echo ===================================
echo Создание правильных архивов для Beget
echo ===================================

rem Очищаем старые архивы
if exist "frontend-beget-new.zip" del "frontend-beget-new.zip"
if exist "backend-beget-new.zip" del "backend-beget-new.zip"

echo Создание нового архива Frontend...

rem Переходим в директорию frontend и создаем архив
cd frontend

rem Создаем архив из содержимого папки frontend (без самой папки frontend)
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\frontend-beget-new.zip' -Force"

cd ..

echo Создание нового архива Backend...

rem Переходим в директорию backend и создаем архив  
cd backend

rem Создаем архив из содержимого папки backend (без самой папки backend)
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\backend-beget-new.zip' -Force"

cd ..

echo.
echo ✅ Новые архивы созданы:
echo 📦 frontend-beget-new.zip
echo 📦 backend-beget-new.zip
echo.
echo Размеры файлов:
for %%F in (frontend-beget-new.zip) do echo Frontend: %%~zF bytes
for %%F in (backend-beget-new.zip) do echo Backend: %%~zF bytes
echo.
echo 📋 Следующие шаги:
echo 1. Загрузите frontend-beget-new.zip в /var/upload/frontend/ на сервере
echo 2. Загрузите backend-beget-new.zip в /var/upload/backend/ на сервере
echo 3. Распакуйте архивы на сервере
echo.
pause