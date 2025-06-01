@echo off
chcp 65001 > nul
echo ============================================
echo ПРИМЕНЕНИЕ ИСПРАВЛЕНИЯ ДЛЯ ОПЕРАЦИЙ ЗАКАЗА
echo ============================================
echo.
echo Выполнение следующих действий:
echo.
echo 1. Остановка приложения
echo 2. Резервное копирование текущего сервиса заказов
echo 3. Применение исправленного сервиса заказов
echo 4. Перезапуск приложения
echo.
echo ============================================
echo.
echo Остановка приложения...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Резервное копирование текущего сервиса заказов...
copy /Y "backend\src\modules\orders\orders.service.ts" "backend\src\modules\orders\orders.service.backup.ts"

echo.
echo Применение исправленного сервиса заказов...
copy /Y "backend\src\modules\orders\orders.service.fixed-operations.ts" "backend\src\modules\orders\orders.service.ts"

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
echo Исправление применено!
echo.
echo Теперь операции должны сохраняться корректно.
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Если проблема не устранена, выполните следующее:
echo 1. Очистите кэш браузера
echo 2. Перезагрузите страницу полностью (Ctrl+F5)
echo 3. Проверьте сохранение операций заново
echo ============================================
pause
