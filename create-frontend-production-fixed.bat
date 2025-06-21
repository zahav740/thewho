@echo off
chcp 65001 > nul
echo ==========================================
echo 📦 СОЗДАНИЕ FRONTEND-PRODUCTION.ZIP
echo ==========================================
echo.

echo ⏰ Начало: %date% %time%
echo.

REM Проверяем текущую директорию
echo 🔍 Проверка окружения...
echo Текущая директория: %cd%

REM Проверяем существование папки frontend\build
if not exist "frontend\build" (
    echo ❌ ОШИБКА: Папка frontend\build не найдена
    echo.
    echo 💡 РЕШЕНИЕ:
    echo 1. Перейдите в папку frontend: cd frontend
    echo 2. Соберите приложение: npm run build
    echo 3. Вернитесь в корневую папку: cd..
    echo 4. Запустите этот батник снова
    echo.
    pause
    exit /b 1
)

echo ✅ Папка frontend\build найдена

REM Проверяем содержимое build
echo.
echo 📁 Содержимое frontend\build:
dir "frontend\build" /b

REM Переходим в папку build
echo.
echo 📂 Переход в frontend\build...
cd "frontend\build"

REM Проверяем, что мы в правильном месте
echo Текущая директория: %cd%
echo.
echo 📋 Файлы для архивирования:
dir /b

REM Удаляем старый архив если есть
echo.
echo 🗑️ Удаление старого архива (если есть)...
if exist "..\..\frontend-production.zip" (
    del "..\..\frontend-production.zip"
    echo ✅ Старый архив удален
) else (
    echo ℹ️ Старого архива нет
)

REM Создаем архив с помощью PowerShell
echo.
echo 🗜️ Создание архива frontend-production.zip...
echo Это может занять несколько секунд...

powershell -Command "try { Compress-Archive -Path '.\*' -DestinationPath '..\..\frontend-production.zip' -CompressionLevel Optimal -Force; Write-Host 'Архив создан успешно' } catch { Write-Host 'Ошибка создания архива:' $_.Exception.Message }"

REM Возвращаемся в корневую папку
cd ..\..

REM Проверяем результат
echo.
echo 📊 Проверка результата...
if exist "frontend-production.zip" (
    echo ✅ УСПЕХ: frontend-production.zip создан!
    echo.
    echo 📏 Информация об архиве:
    for %%F in (frontend-production.zip) do (
        echo   Размер: %%~zF байт
        echo   Дата: %%~tF
    )
    echo.
    echo 📋 Содержимое архива:
    powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('frontend-production.zip'); $zip.Entries | Select-Object Name, Length | Format-Table -AutoSize; $zip.Dispose()"
) else (
    echo ❌ ОШИБКА: frontend-production.zip НЕ СОЗДАН
    echo.
    echo 💡 ВОЗМОЖНЫЕ ПРИЧИНЫ:
    echo 1. PowerShell недоступен
    echo 2. Нехватка места на диске
    echo 3. Проблемы с правами доступа
    echo 4. Антивирус блокирует создание архива
    echo.
    echo 🔧 АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ:
    echo 1. Откройте папку frontend\build в проводнике
    echo 2. Выделите все файлы (Ctrl+A)
    echo 3. Создайте ZIP архив (правый клик → Send to → Compressed folder)
    echo 4. Переименуйте в frontend-production.zip
    echo 5. Переместите в корневую папку проекта
)

echo.
echo ==========================================
echo 📱 ИСПОЛЬЗОВАНИЕ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ
echo ==========================================
echo.
echo Этот архив содержит готовое React приложение с:
echo   ✅ Адаптивным дизайном для мобильных
echo   ✅ PWA функциональностью
echo   ✅ Service Worker
echo   ✅ Мобильными стилями и скриптами
echo.
echo 🚀 Развертывание на Beget:
echo   1. Загрузите frontend-production.zip в панель управления
echo   2. Разархивируйте в папку /var/upload
echo   3. Настройте домен kasuf.xyz на эту папку
echo   4. Проверьте работу на https://kasuf.xyz
echo.

echo ⏰ Завершено: %date% %time%
echo ==========================================

echo.
echo Нажмите любую клавишу для завершения...
pause > nul
