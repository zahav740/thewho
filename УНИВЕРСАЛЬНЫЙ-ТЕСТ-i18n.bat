@echo off
chcp 65001 > nul
echo ==============================================
echo   🚀 УНИВЕРСАЛЬНЫЙ ЗАПУСК И ТЕСТ CRM
echo ==============================================
echo.

echo 📋 Проверяем доступность сервисов...

REM Проверяем backend на разных портах
set backend_port=0
curl -s http://localhost:5100/api/health > nul 2>&1
if %errorlevel% == 0 (
    set backend_port=5100
    echo ✅ Backend доступен на порту 5100
    goto :backend_found
)

curl -s http://localhost:5101/api/health > nul 2>&1
if %errorlevel% == 0 (
    set backend_port=5101
    echo ✅ Backend доступен на порту 5101
    goto :backend_found
)

REM Если API health недоступен, проверяем API переводов
curl -s http://localhost:5100/api/translations/client > nul 2>&1
if %errorlevel% == 0 (
    set backend_port=5100
    echo ✅ Backend доступен на порту 5100 (через API переводов)
    goto :backend_found
)

curl -s http://localhost:5101/api/translations/client > nul 2>&1
if %errorlevel% == 0 (
    set backend_port=5101
    echo ✅ Backend доступен на порту 5101 (через API переводов)
    goto :backend_found
)

echo ❌ Backend недоступен ни на 5100, ни на 5101
echo    Попробуйте запустить: START-BACKEND.bat или ЗАПУСК-BACKEND.bat
goto :error

:backend_found

REM Проверяем frontend
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend доступен на порту 3000
) else (
    echo ❌ Frontend недоступен на порту 3000
    echo    Попробуйте запустить: START-FRONTEND.bat или ЗАПУСК-FRONTEND.bat
    goto :error
)

echo.
echo 🌐 Тестируем систему переводов...

REM Проверяем количество переводов
curl -s http://localhost:%backend_port%/api/translations > temp_count.json 2>nul
if %errorlevel% == 0 (
    for /f %%i in ('jq length temp_count.json 2^>nul') do set trans_count=%%i
    if defined trans_count (
        echo ✅ Найдено %trans_count% переводов в БД
    ) else (
        echo ⚠️  Переводы найдены, но не удалось посчитать количество
    )
    del temp_count.json 2>nul
) else (
    echo ❌ Не удалось получить список переводов
)

echo.
echo 🎯 Результаты проверки:
echo    Backend:     порт %backend_port%
echo    Frontend:    порт 3000
echo    Переводы:    %trans_count% записей
echo.

echo 📱 Открываем приложение...
start http://localhost:3000

echo.
echo 🧪 Инструкции по тестированию переводов:
echo.
echo 1. В правом верхнем углу нажмите на переключатель языка 🌐
echo 2. Переключите с "Русский" на "English" 
echo 3. Убедитесь, что тексты меню изменились
echo 4. Перейдите в меню "Переводы" / "Translations"
echo 5. Попробуйте добавить новый перевод
echo 6. Отредактируйте существующий перевод
echo.
echo ✨ Система готова к использованию!
echo.
goto :end

:error
echo.
echo ❌ Обнаружены проблемы с запуском.
echo    Проверьте, что все сервисы запущены.
echo.

:end
echo Нажмите любую клавишу для завершения...
pause > nul
