@echo off
chcp 65001 > nul
echo ==============================================
echo   🌐 ТЕСТИРОВАНИЕ СИСТЕМЫ ПЕРЕВОДОВ
echo ==============================================
echo.

echo 1. Проверяем БД переводов...
curl -s http://localhost:5100/api/translations/client | jq . > nul
if %errorlevel% == 0 (
    echo ✅ API переводов работает на порту 5100
) else (
    curl -s http://localhost:5101/api/translations/client | jq . > nul
    if %errorlevel% == 0 (
        echo ✅ API переводов работает на порту 5101
    ) else (
        echo ❌ API переводов недоступен ни на 5100, ни на 5101
        echo Убедитесь, что backend запущен
        pause
        exit /b 1
    )
)

echo.
echo 2. Проверяем количество переводов в БД...

REM Пробуем порт 5100
curl -s http://localhost:5100/api/translations > temp_translations.json 2>nul
if %errorlevel% == 0 (
    for /f %%i in ('jq length temp_translations.json') do set count=%%i
    set port=5100
) else (
    REM Пробуем порт 5101
    curl -s http://localhost:5101/api/translations > temp_translations.json 2>nul
    if %errorlevel% == 0 (
        for /f %%i in ('jq length temp_translations.json') do set count=%%i
        set port=5101
    ) else (
        set count=0
        set port=unknown
    )
)
del temp_translations.json 2>nul
echo ✅ В БД найдено %count% переводов (порт %port%)

echo.
echo 3. Проверяем frontend...
curl -s http://localhost:3000 > nul
if %errorlevel% == 0 (
    echo ✅ Frontend доступен на http://localhost:3000
) else (
    echo ❌ Frontend недоступен
    echo Убедитесь, что frontend запущен на порту 3000
)

echo.
echo 4. Открываем страницу переводов...
start http://localhost:3000/translations

echo.
echo ==============================================
echo   📋 ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ
echo ==============================================
echo.
echo 1. Переключите язык в правом верхнем углу
echo 2. Проверьте изменение текстов в меню
echo 3. Перейдите на страницу "Переводы"
echo 4. Попробуйте добавить новый перевод
echo 5. Отредактируйте существующий перевод
echo.
echo Нажмите любую клавишу для завершения...
pause > nul
