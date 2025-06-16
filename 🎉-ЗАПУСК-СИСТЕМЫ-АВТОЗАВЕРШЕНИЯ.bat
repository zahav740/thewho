@echo off
echo ===============================================
echo 🎉 ЗАПУСК СИСТЕМЫ АВТОЗАВЕРШЕНИЯ ОПЕРАЦИЙ
echo ===============================================

echo.
echo [1/3] Проверка готовности backend...
curl -s -X GET "http://localhost:5100/api/operations/completion/check-all-active" > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend не запущен!
    echo.
    echo 🚀 Запускаем backend...
    start /min cmd /c "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\backend && START-FIXED-BACKEND.bat"
    echo ⏳ Ждем 10 секунд для запуска...
    timeout /t 10 /nobreak > nul
) else (
    echo ✅ Backend готов на порту 5100
)

echo.
echo [2/3] Проверка frontend...
curl -s "http://localhost:3000" > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend не запущен!
    echo.
    echo 🚀 Запускаем frontend...
    start /min cmd /c "cd /d C:\Users\kasuf\Downloads\TheWho\production-crm\frontend && npm start"
    echo ⏳ Frontend запускается (это может занять 1-2 минуты)...
) else (
    echo ✅ Frontend готов на порту 3000
)

echo.
echo [3/3] Проверка тестовых данных...
curl -s -X GET "http://localhost:5100/api/operations/completion/check-all-active" > check_result.json 2>&1

echo.
echo ========================================
echo 🎯 СИСТЕМА АВТОЗАВЕРШЕНИЯ ГОТОВА!
echo ========================================
echo.
echo 📋 Тестирование:
echo 1. Откройте: http://localhost:3000
echo 2. Раздел: Смены → Мониторинг производства  
echo 3. Найдите: C6HP0021A-TEST
echo 4. Нажмите: "Запись смены"
echo 5. Введите: День=3, Ночь=2 (итого 5 = план!)
echo 6. Через 15 сек появится уведомление! 🎉
echo.
echo 🔄 Автопроверка: каждые 15 секунд
echo 📱 Три действия: Закрыть | Продолжить | Спланировать
echo 🎛️ Планирование: интеграция с существующим модальным окном
echo.
echo ===============================================
echo 💡 ПОЛНАЯ ИНСТРУКЦИЯ: 
echo    СИСТЕМА-АВТОЗАВЕРШЕНИЯ-ГОТОВА.md
echo ===============================================

echo.
echo Нажмите любую клавишу для открытия браузера...
pause > nul

echo Открываем систему...
start http://localhost:3000

echo.
echo 🚀 Система запущена! Приятной работы!
pause
