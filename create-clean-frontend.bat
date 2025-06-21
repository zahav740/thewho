@echo off
echo ===================================
echo Создание ЧИСТОГО архива Frontend
echo ===================================

rem Удаляем старый архив
if exist "frontend-clean.zip" del "frontend-clean.zip"

rem Создаем временную папку для чистых файлов
if exist "temp_frontend" rmdir /s /q "temp_frontend"
mkdir temp_frontend

echo Копирование необходимых файлов Frontend...

rem Копируем основные файлы
copy "frontend\package.json" "temp_frontend\"
copy "frontend\package-lock.json" "temp_frontend\"
copy "frontend\tsconfig.json" "temp_frontend\"
if exist "frontend\.gitignore" copy "frontend\.gitignore" "temp_frontend\"

rem Копируем папки
echo Копирование src...
xcopy "frontend\src" "temp_frontend\src" /E /I /Q

echo Копирование public...
xcopy "frontend\public" "temp_frontend\public" /E /I /Q

rem Копируем build если есть
if exist "frontend\build" (
    echo Копирование build...
    xcopy "frontend\build" "temp_frontend\build" /E /I /Q
)

rem Создаем .env файл для продакшена
echo REACT_APP_API_URL=https://kasuf.xyz/api > temp_frontend\.env
echo REACT_APP_ENVIRONMENT=production >> temp_frontend\.env
echo PORT=5201 >> temp_frontend\.env

rem Создаем архив из временной папки
cd temp_frontend
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\frontend-clean.zip' -Force"
cd ..

rem Удаляем временную папку
rmdir /s /q "temp_frontend"

echo.
echo ✅ ЧИСТЫЙ архив Frontend создан: frontend-clean.zip
for %%F in (frontend-clean.zip) do echo Размер: %%~zF bytes
echo.
pause