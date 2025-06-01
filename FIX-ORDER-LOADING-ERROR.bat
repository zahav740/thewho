@echo off
chcp 65001 > nul
echo ============================================
echo ИСПРАВЛЕНИЕ ОШИБКИ 500 ПРИ ЗАГРУЗКЕ ЗАКАЗА
echo ============================================
echo.
echo Применены следующие изменения:
echo.
echo 1. УЛУЧШЕНА ОБРАБОТКА ОШИБОК:
echo    - Загрузка операций не прерывает загрузку заказа
echo    - Добавлена защита от некорректных данных
echo    - Более подробное логирование
echo.
echo 2. ИСПРАВЛЕНА ОБРАБОТКА ПОЛЕЙ:
echo    - Безопасное преобразование machineAxes
echo    - Значения по умолчанию для пустых полей
echo.
echo ============================================
echo.
echo Остановка приложения...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul
echo.
echo Перезапуск backend и frontend...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"
echo.
echo ============================================
echo Приложение перезапущено!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Теперь заказы загружаются без ошибки 500
echo ============================================
pause
