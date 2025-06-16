@echo off
echo ============================================
echo ПОЛНОЕ ИСПРАВЛЕНИЕ МОНИТОРИНГА ПРОИЗВОДСТВА
echo ============================================

echo.
echo 🔧 Шаг 1: Добавляем тестовые данные в базу...
call "ДОБАВИТЬ-ТЕСТОВЫЕ-ДАННЫЕ-СМЕН.bat"

echo.
echo 🔧 Шаг 2: Останавливаем процессы...
netstat -ano | findstr :3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul
netstat -ano | findstr :5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /PID %%a /F 2>nul

echo.
echo 🔧 Шаг 3: Запускаем backend...
cd backend
start /B npm run start:dev
timeout /t 5

echo.
echo 🔧 Шаг 4: Запускаем frontend...
cd ..\frontend
start /B npm start
timeout /t 10

echo.
echo 🔧 Шаг 5: Проверяем статус серверов...
netstat -ano | findstr :5000
if %errorlevel% equ 0 (
    echo ✅ Backend запущен на порту 5000
) else (
    echo ❌ Backend не запущен
)

netstat -ano | findstr :3000
if %errorlevel% equ 0 (
    echo ✅ Frontend запущен на порту 3000
) else (
    echo ❌ Frontend не запущен
)

echo.
echo ============================================
echo 📋 ИНСТРУКЦИИ ПО ПРОВЕРКЕ
echo ============================================
echo.
echo 1. Откройте браузер и перейдите на:
echo    http://localhost:3000/shifts
echo.
echo 2. На странице "Смены" -> вкладка "Мониторинг"
echo    вы должны увидеть:
echo    ✅ Упрощенный вид данных производства
echo    ✅ Станки с текущими операциями
echo    ✅ Данные по дневной и ночной смене
echo    ✅ ОБЩИЙ ОБЪЕМ для каждой операции
echo.
echo 3. Проверьте в консоли браузера (F12):
echo    - Данные станков загружены
echo    - Данные смен загружены
echo    - Анализ показывает производство
echo.
echo 4. Если данные не отображаются:
echo    - Обновите страницу (F5)
echo    - Проверьте консоль на ошибки
echo    - Запустите ТЕСТ-API-СМЕН.bat
echo.
echo ============================================
echo ИСПРАВЛЕНИЯ ГОТОВЫ! 🎉
echo ============================================
pause
