@echo off
echo ===================================
echo Создание легкого Frontend архива
echo ===================================

rem Удаляем старый архив
if exist "frontend-beget-light.zip" del "frontend-beget-light.zip"

echo Создание frontend-beget-light.zip БЕЗ node_modules...

rem Переходим в директорию frontend
cd frontend

rem Создаем временную папку для копирования только нужных файлов
if exist temp_frontend rmdir /s /q temp_frontend
mkdir temp_frontend

echo Копируем только необходимые файлы...

rem Копируем основные файлы
copy package.json temp_frontend\
copy package-lock.json temp_frontend\
copy tsconfig.json temp_frontend\
if exist .env copy .env temp_frontend\

rem Копируем папки src и public
xcopy /E /I src temp_frontend\src
xcopy /E /I public temp_frontend\public

rem Если есть готовая сборка build, тоже копируем
if exist build xcopy /E /I build temp_frontend\build

rem Создаем архив из временной папки
cd temp_frontend
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-beget-light.zip' -Force"
cd ..

rem Удаляем временную папку
rmdir /s /q temp_frontend

cd ..

echo.
echo ✅ Легкий архив frontend-beget-light.zip создан!

rem Проверяем размер
for %%F in (frontend-beget-light.zip) do echo Размер: %%~zF bytes (должен быть намного меньше)

echo.
echo 🔍 Проверка содержимого:
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('frontend-beget-light.zip'); Write-Host 'Основные файлы:'; $zip.Entries | Where-Object {$_.Name -match '\.(json|js|ts|tsx)$' -or $_.Name -eq 'package.json'} | Select-Object Name | ForEach-Object { Write-Host $_.Name }; $hasPackageJson = $zip.Entries | Where-Object {$_.Name -eq 'package.json'}; if($hasPackageJson) { Write-Host '✅ package.json найден' -ForegroundColor Green } else { Write-Host '❌ package.json НЕ найден' -ForegroundColor Red }; $zip.Dispose()"

echo.
echo 📋 Что включено в архив:
echo ✅ package.json и package-lock.json
echo ✅ tsconfig.json
echo ✅ Папка src/ (исходный код)
echo ✅ Папка public/ (статика)
echo ✅ Папка build/ (если есть)
echo ❌ node_modules/ (ИСКЛЮЧЕНА - экономит время и место)
echo.
echo 📋 На сервере нужно будет выполнить npm install
echo.
pause