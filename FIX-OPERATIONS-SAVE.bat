@echo off
chcp 65001 > nul
echo ============================================
echo ИСПРАВЛЕНИЕ СОХРАНЕНИЯ ОПЕРАЦИЙ
echo ============================================
echo.
echo Применены следующие изменения:
echo.
echo 1. BACKEND - OrdersService:
echo    - Добавлена обработка операций при создании заказа
echo    - Добавлена обработка операций при обновлении заказа
echo    - Операции теперь загружаются вместе с заказами
echo.
echo 2. DATABASE - Order Entity:
echo    - Восстановлена связь OneToMany с операциями
echo    - Добавлен cascade для автоматического сохранения
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
echo Теперь операции будут сохраняться при создании
echo и редактировании заказов.
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo ============================================
pause
