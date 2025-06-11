@echo off
chcp 65001 >nul
echo.
echo ================================================================
echo 🎯 ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЯ СТАРЫХ ДАННЫХ В МОНИТОРИНГЕ
echo ================================================================
echo.

echo 📋 ПРОБЛЕМА:
echo    На карточке "Doosan 3" показываются старые данные
echo    "День: 10, Ночь: 20" от предыдущих операций
echo    Новая операция C6HP0021A должна показывать 0/0
echo.

echo 🔧 ИСПРАВЛЕНИЯ:
echo    ✅ Добавлена фильтрация по времени назначения операции
echo    ✅ Добавлен индикатор "НОВАЯ ОПЕРАЦИЯ" 
echo    ✅ Смены теперь привязаны к конкретному циклу операции
echo.

echo 🚀 Запускаем приложение для проверки...
echo.

echo [1/3] Проверяем backend...
curl -s http://localhost:5100/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend работает
) else (
    echo 🚀 Запускаем backend...
    cd backend
    start /min "Backend-Monitor-Fix" cmd /c "npm run start:dev"
    timeout /t 10 /nobreak >nul
    cd ..
)

echo.
echo [2/3] Проверяем frontend...
netstat -an | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend работает
) else (
    echo 🚀 Запускаем frontend...
    cd frontend
    start /min "Frontend-Monitor-Fix" cmd /c "npm start"
    timeout /t 20 /nobreak >nul
    cd ..
)

echo.
echo [3/3] Открываем страницу для проверки...
start "" "http://localhost:3000/#/shifts"
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo 🎯 ИНСТРУКЦИИ ПО ПРОВЕРКЕ
echo ================================================================
echo.
echo 📍 ОТКРОЙТЕ СТРАНИЦУ СМЕНЫ:
echo    http://localhost:3000/#/shifts
echo.
echo 🔍 ЧТО ПРОВЕРИТЬ:
echo    1. Найдите карточку "Doosan 3"
echo    2. Убедитесь что операция: C6HP0021A
echo    3. В разделе "Производство по операции" должно быть:
echo       - Tag "🆕 НОВАЯ ОПЕРАЦИЯ" 
echo       - "День: 0" вместо старых "День: 10"
echo       - "Ночь: 0" вместо старых "Ночь: 20"
echo.
echo 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
echo    ✅ Новые операции показывают 0/0
echo    ✅ Старые данные не отображаются
echo    ✅ Индикатор "НОВАЯ ОПЕРАЦИЯ" виден
echo.
echo 🐛 ЕСЛИ НЕ РАБОТАЕТ:
echo    1. Проверьте консоль браузера (F12)
echo    2. Найдите логи "🕒 Фильтруем смены..."
echo    3. Убедитесь что время назначения передается
echo.
echo 📝 ДОПОЛНИТЕЛЬНЫЙ ТЕСТ:
echo    1. Создайте запись смены на Doosan 3
echo    2. Убедитесь что счетчики обновились
echo    3. Назначьте новую операцию
echo    4. Счетчики должны обнулиться снова
echo.
pause
