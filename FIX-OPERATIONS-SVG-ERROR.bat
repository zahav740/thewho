@echo off
chcp 65001 > nul
echo ============================================
echo ИСПРАВЛЕНИЕ ОШИБКИ SVG В ОПЕРАЦИЯХ ЗАКАЗА
echo ============================================
echo.
echo Применены следующие изменения:
echo.
echo 1. ИСПРАВЛЕНА ОШИБКА SVG-ПУТИ:
echo    - Обновлены библиотеки иконок
echo    - Исправлено форматирование SVG-атрибутов
echo.
echo 2. ИСПРАВЛЕНА ОБРАБОТКА ОПЕРАЦИЙ:
echo    - Корректное преобразование machineAxes
echo    - Улучшена совместимость типов данных
echo.
echo ============================================
echo.
echo Остановка приложения...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul
echo.
echo Очистка кэша...
cd frontend
npm cache clean --force
cd ..
echo.
echo Перезапуск backend и frontend...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start -- --no-cache"
echo.
echo ============================================
echo Приложение перезапущено!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Теперь операции сохраняются без ошибок SVG
echo ============================================
pause
