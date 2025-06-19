@echo off
echo.
echo 🔍 Поиск недостающих переводов в Production CRM
echo.

cd /d "%~dp0"

echo 📁 Анализируем файлы в директории src...
echo.

:: Проверяем наличие основных файлов
if not exist "src\i18n\translations.ts" (
    echo ❌ Файл переводов не найден: src\i18n\translations.ts
    pause
    exit /b 1
)

echo ✅ Файл переводов найден: src\i18n\translations.ts
echo.

:: Поиск всех ключей t('...') в файлах TypeScript и React
echo 🔍 Ищем все ключи переводов в коде...
echo.

:: Создаем временный файл для результатов
set "temp_file=%temp%\translation_keys.txt"
if exist "%temp_file%" del "%temp_file%"

:: Поиск ключей в файлах .tsx и .ts
for /r src %%f in (*.tsx *.ts) do (
    findstr /R "t\s*(\s*['\"]" "%%f" >nul 2>&1
    if !errorlevel! equ 0 (
        echo 📄 Найдены переводы в файле: %%f
        findstr /R "t\s*(\s*['\"]" "%%f"
        echo.
    )
)

echo.
echo 🎯 Проверка завершена!
echo.
echo 💡 Рекомендации:
echo    1. Убедитесь, что все найденные ключи есть в src\i18n\translations.ts
echo    2. При добавлении нового текста всегда используйте t('ключ') вместо хардкода
echo    3. Добавляйте переводы сразу для обоих языков (ru и en)
echo.
pause
