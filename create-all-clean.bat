@echo off
echo ===================================
echo Создание ВСЕХ чистых архивов
echo ===================================

echo 1. Создание чистого Frontend архива...
call create-clean-frontend.bat

echo.
echo 2. Создание чистого Backend архива...
call create-clean-backend.bat

echo.
echo ===================================
echo ✅ ВСЕ АРХИВЫ СОЗДАНЫ!
echo ===================================
echo.
echo Созданные файлы:
dir /B *clean.zip
echo.
for %%F in (frontend-clean.zip) do echo Frontend: %%~zF bytes
for %%F in (backend-clean.zip) do echo Backend: %%~zF bytes
echo.
echo 📋 Следующие шаги:
echo 1. Загрузите frontend-clean.zip в /var/upload/frontend/ на сервере
echo 2. Загрузите backend-clean.zip в /var/upload/backend/ на сервере
echo 3. Распакуйте на сервере и запустите установку
echo.
pause